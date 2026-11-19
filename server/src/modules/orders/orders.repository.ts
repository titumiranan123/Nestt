import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ReturnStatus,
  TransactionStatus,
  TransactionSource,
} from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type {
  DeliveryAreaInput,
  UpdateDeliveryAreaInput,
  DeliveryZoneConfigInput,
  CreateAdminOrder,
  CreateOrder,
  CreateOrderRemark,
  ListOrders,
  QuoteOrder,
  RequestReturn,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateReturnStatus,
} from './dto/order.schemas.js';
import { resolveDeliveryFee } from '../shipping/delivery-fee.resolver.js';
import { PrismaService } from '../../database/prisma.service.js';
import { allocateOrderCode } from './order-numbering.js';
import {
  paginationOffset,
  paginationResult,
} from '../../common/utils/pagination.js';

const orderDetails = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  items: true,
  payment: { include: { transactions: { orderBy: { createdAt: 'desc' as const } } } },
  statusHistories: { orderBy: { createdAt: 'asc' as const } },
  returns: { include: { item: true }, orderBy: { createdAt: 'desc' as const } },
  remarks: { orderBy: { createdAt: 'desc' as const } },
};

const gatewayOrder = {
  payment: { include: {
    transactions: { where: { source: TransactionSource.SSL_COMMERZ }, take: 1, orderBy: { createdAt: 'asc' as const } },
  } },
} satisfies Prisma.OrderInclude;

export type GatewayOrder = Prisma.OrderGetPayload<{ include: typeof gatewayOrder }>;
export type GatewaySession = { gatewayUrl: string; sessionKey: string; sandbox: boolean };
export type GatewayResult = 'success' | 'failed' | 'cancelled' | 'pending';

export function gatewayOrderResult(order: Pick<GatewayOrder, 'paymentStatus' | 'status' | 'cancelReason'>): GatewayResult {
  if (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED' || order.paymentStatus === 'REFUNDED') return 'success';
  if (order.cancelReason === 'SSLCommerz payment cancelled') return 'cancelled';
  if (order.paymentStatus === 'FAILED') return 'failed';
  if (order.status === 'CANCELLED') return 'cancelled';
  return 'pending';
}

export function readGatewaySession(metadata: Prisma.JsonValue): GatewaySession | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const { gatewayUrl, sessionKey, sandbox } = metadata;
  return typeof gatewayUrl === 'string' && typeof sessionKey === 'string' && typeof sandbox === 'boolean'
    ? { gatewayUrl, sessionKey, sandbox } : null;
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: PrismaService) {}

  async findCheckout(userId: string, checkoutKey: string, fingerprint?: string) {
    const order = await this.db.order.findFirst({
      where: { userId, OR: [{ checkoutKey: { is: { key: checkoutKey } } }, { orderCode: checkoutKey, checkoutKey: null }] },
      select: { id: true, orderCode: true, metadata: true },
    });
    if (!order) return null;
    if (!fingerprint) return order;
    const metadata = order.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || metadata.checkoutFingerprint !== fingerprint) {
      throw new ConflictException('This checkout has already been submitted with different details');
    }
    return order;
  }

  async quoteCheckout(userId: string | null | undefined, input: QuoteOrder) {
    const address = input.addressId
      ? userId ? await this.db.address.findFirst({ where: { id: input.addressId, userId } }) : null
      : null;
    if (input.addressId && !address) throw new NotFoundException('Shipping address not found');
    const { items, subTotal, shippingCharge, totalAmount } = await this.priceCheckout(
      this.db, input.items, address?.thanaId ?? input.thanaId,
    );
    for (const item of items) {
      if (item.variant.stockQty < item.quantity) {
        throw new ConflictException(`Insufficient stock for ${item.variant.product.name}`);
      }
    }
    return {
      subtotal: subTotal,
      shippingCharge,
      total: totalAmount,
      items: items.map(({ variantId, total }) => ({ variantId, lineTotal: total })),
    };
  }

  private async priceCheckout(
    tx: Prisma.TransactionClient,
    requested: CreateOrder['items'],
    thanaId?: string | null,
  ) {
    if (!thanaId) throw new ConflictException('Select a delivery area for this saved address before checkout');
    const thana = await tx.thana.findUnique({
      where: { id: thanaId },
      include: { district: { include: { division: true } } },
    });
    if (!thana?.isDeliverable) throw new ConflictException('Delivery is not available for this area');

    const variants = await tx.productVariant.findMany({
      where: {
        id: { in: requested.map((item) => item.variantId) },
        status: 'active',
        deletedAt: null,
        product: { is: { status: 'active', deletedAt: null } },
      },
      include: {
        product: true,
        media: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }], take: 1 },
      },
    });
    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
    const items = requested.map((item) => {
      const variant = variantsById.get(item.variantId);
      if (!variant) throw new NotFoundException('One or more products are unavailable');
      if (variant.product.isPriceOnRequest) throw new ConflictException(`${variant.product.name} is available by price request`);
      if (variant.stockStatus === 'OUT_OF_STOCK' || variant.stockStatus === 'PREORDER') {
        throw new ConflictException(`${variant.product.name} is currently unavailable`);
      }
      return { ...item, variant, total: variant.price.mul(item.quantity) };
    });
    const subTotal = items.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));
    const zoneConfig = await tx.deliveryZoneConfig.findUnique({ where: { zone: thana.deliveryZone } });
    const shippingCharge = resolveDeliveryFee(thana, zoneConfig, subTotal).fee;
    return { items, thana, subTotal, shippingCharge, totalAmount: subTotal.add(shippingCharge) };
  }

  async checkoutPhone(userId: string | null | undefined, input: CreateOrder) {
    const saved = input.addressId
      ? userId ? await this.db.address.findFirst({ where: { id: input.addressId, userId }, select: { phone: true } }) : null
      : null;
    const phone = saved?.phone ?? input.shippingAddress?.phone;
    if (!phone) throw new NotFoundException('Shipping address not found');
    return this.validCheckoutPhone(phone);
  }

  private validCheckoutPhone(phone: string) {
    const parsed = parsePhoneNumberFromString(phone, 'BD');
    if (!parsed?.isValid()) throw new BadRequestException('Enter a valid phone number for this order');
    return parsed.number;
  }

  createCheckout(userId: string, fallbackCode: string, input: CreateOrder, fingerprint?: string, verifiedPhone?: string) {
    return this.db.$transaction(async (tx) => {
      const savedAddress = input.addressId && userId
        ? await tx.address.findFirst({ where: { id: input.addressId, userId } })
        : null;
      const address = savedAddress
        ? {
            name: savedAddress.fullName,
            phone: savedAddress.phone,
            region: savedAddress.region,
            city: savedAddress.city,
            area: savedAddress.area,
            thanaId: savedAddress.thanaId,
            address: savedAddress.addressLine,
            postalCode: savedAddress.postalCode,
          }
        : input.shippingAddress;
      if (!address) throw new NotFoundException('Shipping address not found');
      const contactPhone = input.contactEmail ? this.validCheckoutPhone(address.phone) : address.phone;
      if (verifiedPhone && contactPhone !== verifiedPhone) {
        throw new ConflictException('Shipping phone changed. Verify the new phone before placing this order.');
      }
      const { items, thana, subTotal, shippingCharge, totalAmount } = await this.priceCheckout(tx, input.items, address.thanaId);
      if (input.expectedTotal !== undefined && !totalAmount.equals(input.expectedTotal)) {
        throw new ConflictException('The order total has changed. Review the updated amount and try again.');
      }

      const reservedVariantIds = await this.reserveStock(tx, items);
      if (reservedVariantIds.length !== items.length) {
        const reservedIds = new Set(reservedVariantIds);
        const unavailableItem = items.find(
          (item) => !reservedIds.has(item.variant.id),
        );
        throw new ConflictException(
          `Insufficient stock for ${unavailableItem?.variant.product.name ?? 'product'}`,
        );
      }

      const shipping = {
        name: address.name,
        phone: contactPhone,
        region: thana.district.division.name,
        city: thana.district.name,
        area: thana.name,
        thanaId: thana.id,
        address: address.address,
        postalCode: address.postalCode ?? null,
      };
      let billing = shipping;
      if (!input.billingSameAsShipping && input.billingAddress) {
        const billingThana = await tx.thana.findUnique({
          where: { id: input.billingAddress.thanaId },
          include: { district: { include: { division: true } } },
        });
        if (!billingThana)
          throw new NotFoundException('Billing delivery area not found');
        billing = {
          ...input.billingAddress,
          region: billingThana.district.division.name,
          city: billingThana.district.name,
          area: billingThana.name,
          thanaId: billingThana.id,
          postalCode: input.billingAddress.postalCode ?? null,
        };
      }

      const orderCode = await allocateOrderCode(tx, fallbackCode);
      return tx.order.create({
        data: {
          orderCode,
          ...(fingerprint && {
            checkoutKey: { create: { key: fallbackCode } },
            metadata: { checkoutFingerprint: fingerprint },
          }),
          userId,
          guestPhone: null,
          guestEmail: null,
          addressId: input.addressId,
          shippingThanaId: thana.id,
          subTotal,
          shippingCharge,
          discountAmount: new Prisma.Decimal(0),
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus:
            input.paymentMethod === 'CASH_ON_DELIVERY'
              ? PaymentStatus.UNPAID
              : PaymentStatus.PENDING,
          orderSource: 'ONLINE',
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          contactEmail: input.contactEmail,
          orderPhoneVerifiedAt: verifiedPhone ? new Date() : undefined,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          shippingRegion: shipping.region,
          shippingCity: shipping.city,
          shippingArea: shipping.area,
          shippingAddress: shipping.address,
          shippingPostalCode: shipping.postalCode,
          billingSameAsShipping: input.billingSameAsShipping,
          billingName: billing.name,
          billingPhone: billing.phone,
          billingRegion: billing.region,
          billingCity: billing.city,
          billingArea: billing.area,
          billingAddress: billing.address,
          billingPostalCode: billing.postalCode,
          notes: input.notes,
          items: {
            create: items.map((item) => ({
              variantId: item.variant.id,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              image: item.variant.media[0]?.url ?? null,
              quantity: item.quantity,
              unitPrice: item.variant.price,
              totalPrice: item.total,
              stockReserved: true,
            })),
          },
          payment: {
            create: {
              method: input.paymentMethod,
              status:
                input.paymentMethod === 'CASH_ON_DELIVERY'
                  ? PaymentStatus.UNPAID
                  : PaymentStatus.PENDING,
              amount: totalAmount,
              currency: 'BDT',
              transactions:
                input.paymentMethod === 'SSL_COMMERZ'
                  ? {
                      create: {
                        source: TransactionSource.SSL_COMMERZ,
                        status: TransactionStatus.PENDING,
                        amount: totalAmount,
                        currency: 'BDT',
                        metadata: { stage: 'awaiting_gateway_start' },
                      },
                    }
                  : undefined,
            },
          },
          statusHistories: {
            create: {
              status: OrderStatus.PENDING,
              changedBy: userId,
              source: 'SYSTEM',
              isPublic: true,
              note: 'Order placed',
            },
          },
        },
        include: orderDetails,
      });
    });
  }

  async listMine(userId: string, query: ListOrders) {
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [orders, total] = await this.db.$transaction([
      this.db.order.findMany({
        where,
        include: {
          items: true,
          payment: { select: { method: true } },
          statusHistories: {
            where: { isPublic: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        omit: { metadata: true, guestSessionId: true },
        orderBy: { createdAt: 'desc' },
        skip: paginationOffset(query.page, query.pageSize),
        take: query.pageSize,
      }),
      this.db.order.count({ where }),
    ]);
    return paginationResult(orders, total, query.page, query.pageSize, {
      pageSizeKey: 'pageSize',
    });
  }

  findMine(userId: string, id: string) {
    return this.db.order.findFirst({
      where: { id, userId },
      include: {
        items: true,
        payment: { select: { method: true } },
        returns: { orderBy: { createdAt: 'desc' } },
        statusHistories: {
          where: { isPublic: true },
          orderBy: { createdAt: 'asc' },
        },
        remarks: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
        },
      },
      omit: { metadata: true, guestSessionId: true },
    });
  }

  cancelMine(userId: string, id: string, reason?: string) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.CONFIRMED
      ) {
        throw new ConflictException('This order can no longer be cancelled');
      }
      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new ConflictException(
          'Paid orders must be refunded before cancellation',
        );
      }
      const update = await tx.order.updateMany({
        where: { id, userId, status: order.status, version: order.version },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason,
          version: { increment: 1 },
        },
      });
      if (update.count !== 1)
        throw new ConflictException('Order changed; reload and try again');
      await this.releaseReservedStock(tx, order.items);
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: OrderStatus.CANCELLED,
          changedBy: userId,
          source: 'SYSTEM',
          note: reason ?? 'Cancelled by customer',
          isPublic: true,
        },
      });
      return tx.order.findUnique({ where: { id }, include: orderDetails });
    });
  }

  createAdmin(fallbackCode: string, actorId: string, input: CreateAdminOrder) {
    return this.db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: input.items.map(({ variantId }) => variantId) },
          status: 'active',
          deletedAt: null,
          product: { is: { status: 'active', deletedAt: null } },
        },
        include: {
          product: true,
          media: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }], take: 1 },
        },
      });
      if (variants.length !== input.items.length) {
        throw new NotFoundException('One or more products are unavailable');
      }

      const isPickup = input.fulfillmentType === 'PICKUP';
      const thana = isPickup ? null : await tx.thana.findUnique({
        where: { id: input.shippingThanaId! },
        include: { district: { include: { division: true } } },
      });
      if (!isPickup && !thana) throw new NotFoundException('Delivery area not found');
      if (thana && !thana.isDeliverable) throw new ConflictException('Delivery is not available for this area');

      const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
      const items = input.items.map((item) => {
        const variant = variantsById.get(item.variantId);
        if (!variant) throw new NotFoundException('One or more products are unavailable');
        return { ...item, variant, total: variant.price.mul(item.quantity) };
      });
      const subTotal = items.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0));
      const discountAmount = new Prisma.Decimal(input.discountAmount);
      if (discountAmount.greaterThan(subTotal)) {
        throw new ConflictException('Discount cannot exceed the item subtotal');
      }
      const zoneConfig = thana ? await tx.deliveryZoneConfig.findUnique({ where: { zone: thana.deliveryZone } }) : null;
      const shippingCharge = thana ? resolveDeliveryFee(thana, zoneConfig, subTotal).fee : new Prisma.Decimal(0);
      const totalAmount = subTotal.add(shippingCharge).sub(discountAmount);
      const reservedVariantIds = await this.reserveStock(tx, items);
      if (reservedVariantIds.length !== items.length) {
        const reservedIds = new Set(reservedVariantIds);
        const unavailableItem = items.find(({ variant }) => !reservedIds.has(variant.id));
        throw new ConflictException(`Insufficient stock for ${unavailableItem?.variant.product.name ?? 'product'}`);
      }

      const paymentStatus = input.paymentStatus;
      const orderStatus = OrderStatus.PENDING;
      const paymentTransaction = paymentStatus === PaymentStatus.PAID
        ? {
            create: {
              source: input.paymentMethod === 'CASH_ON_DELIVERY' ? TransactionSource.COD_COLLECTION : TransactionSource.ADMIN_ADJUSTMENT,
              status: TransactionStatus.SUCCESS,
              amount: totalAmount,
              currency: 'BDT',
              metadata: { source: 'admin', actorId, manualReference: input.paymentReference ?? null },
            },
          }
        : undefined;

      const orderCode = await allocateOrderCode(tx, fallbackCode);
      return tx.order.create({
        data: {
          orderCode,
          userId: null,
          addressId: null,
          shippingThanaId: thana?.id ?? null,
          subTotal,
          shippingCharge,
          discountAmount,
          totalAmount,
          status: orderStatus,
          paymentStatus,
          orderSource: input.source,
          shippingName: input.customerName,
          shippingPhone: input.phone,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          shippingRegion: thana?.district.division.name ?? 'Store pickup',
          shippingCity: thana?.district.name ?? 'Store pickup',
          shippingArea: thana?.name ?? 'Store pickup',
          shippingAddress: input.shippingAddress ?? 'Store pickup',
          shippingPostalCode: input.shippingPostalCode ?? null,
          guestPhone: input.phone,
          guestEmail: input.email ?? null,
          billingSameAsShipping: true,
          billingName: input.customerName,
          billingPhone: input.phone,
          billingRegion: thana?.district.division.name ?? 'Store pickup',
          billingCity: thana?.district.name ?? 'Store pickup',
          billingArea: thana?.name ?? 'Store pickup',
          billingAddress: input.shippingAddress ?? 'Store pickup',
          billingPostalCode: input.shippingPostalCode ?? null,
          notes: input.notes ?? null,
          items: {
            create: items.map((item) => ({
              variantId: item.variant.id,
              productName: item.variant.product.name,
              variantName: item.variant.name,
              sku: item.variant.sku,
              image: item.variant.media[0]?.url ?? null,
              quantity: item.quantity,
              unitPrice: item.variant.price,
              totalPrice: item.total,
              stockReserved: true,
            })),
          },
          payment: {
            create: {
              method: input.paymentMethod,
              status: paymentStatus,
              amount: totalAmount,
              currency: 'BDT',
              ...(paymentTransaction ? { transactions: paymentTransaction } : {}),
            },
          },
          statusHistories: {
            create: {
              status: orderStatus,
              changedBy: actorId,
              source: 'ADMIN',
              isPublic: true,
              note: 'Order created by admin',
            },
          },
        },
        include: orderDetails,
      });
    });
  }

  listAll(query: ListOrders) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.search ? {
        OR: [
          { orderCode: { contains: query.search, mode: 'insensitive' } },
          { shippingName: { contains: query.search, mode: 'insensitive' } },
          { shippingPhone: { contains: query.search } },
          { emergencyContactPhone: { contains: query.search } },
          { guestEmail: { contains: query.search, mode: 'insensitive' } },
          { contactEmail: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    return this.db.$transaction(async (tx) => {
      const [orders, total, allCount, pendingCount, processingCount, paymentPendingCount, paidRevenue] = await Promise.all([
        tx.order.findMany({
          where,
          include: { items: true, payment: true, user: { select: { id: true, name: true, email: true, phone: true } } },
          orderBy: { createdAt: 'desc' },
          skip: paginationOffset(query.page, query.pageSize),
          take: query.pageSize,
        }),
        tx.order.count({ where }),
        tx.order.count(),
        tx.order.count({ where: { status: OrderStatus.PENDING } }),
        tx.order.count({ where: { status: OrderStatus.PROCESSING } }),
        tx.order.count({ where: { paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PENDING] } } }),
        tx.order.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { totalAmount: true } }),
      ]);
      return {
        ...paginationResult(orders, total, query.page, query.pageSize, {
        pageSizeKey: 'pageSize',
        }),
        summary: {
          total: allCount,
          pending: pendingCount,
          processing: processingCount,
          paymentPending: paymentPendingCount,
          paidRevenue: paidRevenue._sum.totalAmount ?? new Prisma.Decimal(0),
        },
      };
    });
  }

  findById(id: string) {
    return this.db.order.findUnique({ where: { id }, include: orderDetails });
  }

  async findGatewayOrder(id: string, userId?: string) {
    return this.requireGatewayOrder(this.db, id, userId);
  }

  private async requireGatewayOrder(tx: Prisma.TransactionClient, id: string, userId?: string) {
    const order = await tx.order.findFirst({ where: { id, userId }, include: gatewayOrder });
    if (order?.orderSource !== 'ONLINE' || order.payment?.method !== 'SSL_COMMERZ' ||
        !order.orderPhoneVerifiedAt || !order.payment.transactions[0]) {
      throw new NotFoundException('Online payment not found');
    }
    return { order, payment: order.payment, transaction: order.payment.transactions[0] };
  }

  async startGatewaySession(id: string, userId: string, start: (order: GatewayOrder) => Promise<GatewaySession>) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${id}::uuid AND user_id = ${userId}::uuid FOR UPDATE`;
      const { order, transaction } = await this.requireGatewayOrder(tx, id, userId);
      const outcome = gatewayOrderResult(order);
      if (outcome !== 'pending') return { outcome };
      const existing = readGatewaySession(transaction.metadata);
      if (existing) return { outcome, gatewayUrl: existing.gatewayUrl };
      const session = await start(order);
      await tx.transaction.update({ where: { id: transaction.id }, data: { metadata: session } });
      return { outcome, gatewayUrl: session.gatewayUrl };
    }, { timeout: 12_000 });
  }

  async settleGatewayOrder(id: string, outcome: Exclude<GatewayResult, 'pending'>, bankReference?: string, onlyUnstarted = false) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${id}::uuid FOR UPDATE`;
      const { order, payment, transaction } = await this.requireGatewayOrder(tx, id);
      const existing = gatewayOrderResult(order);
      if (existing !== 'pending') return existing;
      if (onlyUnstarted && readGatewaySession(transaction.metadata)) return 'pending';
      const success = outcome === 'success';
      const paymentStatus = success ? PaymentStatus.PAID : PaymentStatus.FAILED;
      const reason = outcome === 'cancelled' ? 'SSLCommerz payment cancelled' : 'SSLCommerz payment failed';
      await tx.transaction.update({ where: { id: transaction.id }, data: {
        status: success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
        gatewayTransactionId: bankReference,
      } });
      await tx.payment.update({ where: { id: payment.id }, data: { status: paymentStatus } });
      await tx.order.update({ where: { id }, data: {
        paymentStatus, version: { increment: 1 },
        ...(!success && { status: OrderStatus.CANCELLED, cancelReason: reason }),
      } });
      if (!success) {
        await this.releaseReservedStock(tx, await tx.orderItem.findMany({ where: { orderId: id } }));
        await tx.orderStatusHistory.create({ data: { orderId: id, status: OrderStatus.CANCELLED, note: reason, source: 'SYSTEM' } });
      }
      return outcome;
    });
  }

  updateStatus(id: string, actorId: string, input: UpdateOrderStatus, expectedVersion: number) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true, user: { select: { email: true } } },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.version !== expectedVersion)
        throw new ConflictException('Order changed; reload and try again');
      const update = await tx.order.updateMany({
        where: { id, status: order.status, version: order.version },
        data: { status: input.status, version: { increment: 1 } },
      });
      if (update.count !== 1)
        throw new ConflictException('Order changed; reload and try again');
      if (input.status === OrderStatus.CANCELLED)
        await this.releaseReservedStock(tx, order.items);
      const recipient = order.contactEmail ?? order.guestEmail ?? order.user?.email;
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: input.status,
          changedBy: actorId,
          source: 'ADMIN',
          note: input.note,
          isPublic: input.isPublic,
          ...(input.isPublic && recipient && { email: { create: { recipient } } }),
        },
      });
      return tx.order.findUnique({ where: { id }, include: orderDetails });
    });
  }

  updatePaymentStatus(
    orderId: string,
    actorId: string,
    input: UpdatePaymentStatus,
  ) {
    return this.db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { orderId } });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === PaymentStatus.PAID) {
        throw new ConflictException('Payment has already been marked paid');
      }
      if (
        payment.method === 'CASH_ON_DELIVERY' &&
        input.status !== 'PAID'
      ) {
        throw new ConflictException(
          'A COD payment can only be marked paid after cash collection',
        );
      }
      const status =
        input.status === 'PAID' ? PaymentStatus.PAID : PaymentStatus.FAILED;
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: {
            in: [
              PaymentStatus.UNPAID,
              PaymentStatus.FAILED,
              PaymentStatus.PENDING,
            ],
          },
        },
        data: { status },
      });
      if (paymentUpdate.count !== 1) {
        throw new ConflictException('Payment changed; reload and try again');
      }
      const orderUpdate = await tx.order.updateMany({
        where: { id: orderId, status: { not: OrderStatus.CANCELLED } },
        data: { paymentStatus: status, version: { increment: 1 } },
      });
      if (orderUpdate.count !== 1) {
        throw new ConflictException(
          'Order is no longer eligible for payment updates',
        );
      }
      const transactionData = {
        source:
          payment.method === 'CASH_ON_DELIVERY'
            ? TransactionSource.COD_COLLECTION
            : TransactionSource.ADMIN_ADJUSTMENT,
        status:
          input.status === 'PAID'
            ? TransactionStatus.SUCCESS
            : TransactionStatus.FAILED,
        amount: payment.amount,
        currency: payment.currency,
        metadata: {
          source: 'admin',
          actorId,
          manualReference: input.reference ?? null,
        },
      };
      const pendingSslAttempt =
        payment.method === 'SSL_COMMERZ'
          ? await tx.transaction.findFirst({
              where: {
                paymentId: payment.id,
                source: TransactionSource.SSL_COMMERZ,
                status: TransactionStatus.PENDING,
              },
              orderBy: { createdAt: 'desc' },
            })
          : null;
      if (pendingSslAttempt) {
        await tx.transaction.update({
          where: { id: pendingSslAttempt.id },
          data: transactionData,
        });
      } else {
        await tx.transaction.create({
          data: { ...transactionData, paymentId: payment.id },
        });
      }
      return tx.payment.findUnique({ where: { id: payment.id } });
    });
  }

  addRemark(orderId: string, actorId: string, input: CreateOrderRemark) {
    return this.db.orderRemark.create({
      data: { orderId, createdBy: actorId, ...input },
    });
  }

  requestReturn(userId: string, orderId: string, input: RequestReturn) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { items: { where: { id: input.itemId } } },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.DELIVERED) {
        throw new ConflictException(
          'Returns are only available for delivered orders',
        );
      }
      if (order.items.length === 0)
        throw new NotFoundException('Order item not found');
      const existing = await tx.orderReturn.findFirst({
        where: {
          orderId,
          itemId: input.itemId,
          status: { not: ReturnStatus.REJECTED },
        },
      });
      if (existing)
        throw new ConflictException(
          'A return has already been requested for this item',
        );
      return tx.orderReturn.create({
        data: { orderId, itemId: input.itemId, reason: input.reason },
      });
    });
  }

  updateReturnStatus(
    id: string,
    previousStatus: ReturnStatus,
    input: UpdateReturnStatus,
  ) {
    return this.db.orderReturn.updateMany({
      where: { id, status: previousStatus },
      data: { status: input.status },
    });
  }

  findReturnById(id: string) {
    return this.db.orderReturn.findUnique({ where: { id } });
  }

  listDeliveryAreas() {
    return this.db.division.findMany({
      include: {
        districts: {
          include: { thanas: { orderBy: { name: 'asc' } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  saveDeliveryArea(input: DeliveryAreaInput) {
    return this.db.$transaction(async (tx) => {
      const division = await tx.division.upsert({
        where: { name: input.division },
        create: { name: input.division },
        update: {},
      });
      const district = await tx.district.upsert({
        where: {
          divisionId_name: { divisionId: division.id, name: input.district },
        },
        create: { name: input.district, divisionId: division.id },
        update: {},
      });
      return tx.thana.upsert({
        where: {
          districtId_name: { districtId: district.id, name: input.thana },
        },
        create: {
          name: input.thana,
          districtId: district.id,
          deliveryZone: input.deliveryZone,
          shippingFee:
            input.shippingFee == null
              ? null
              : new Prisma.Decimal(input.shippingFee),
          isDeliverable: input.isDeliverable,
          freeDeliveryAbove:
            input.freeDeliveryAbove == null
              ? null
              : new Prisma.Decimal(input.freeDeliveryAbove),
        },
        update: {
          deliveryZone: input.deliveryZone,
          shippingFee:
            input.shippingFee == null
              ? null
              : new Prisma.Decimal(input.shippingFee),
          isDeliverable: input.isDeliverable,
          freeDeliveryAbove:
            input.freeDeliveryAbove == null
              ? null
              : new Prisma.Decimal(input.freeDeliveryAbove),
        },
        include: { district: { include: { division: true } } },
      });
    });
  }

  updateDeliveryArea(thanaId: string, input: UpdateDeliveryAreaInput) {
    return this.db.thana.update({
      where: { id: thanaId },
      data: {
        name: input.thana,
        deliveryZone: input.deliveryZone,
        shippingFee:
          input.shippingFee == null
            ? null
            : new Prisma.Decimal(input.shippingFee),
        isDeliverable: input.isDeliverable,
        freeDeliveryAbove:
          input.freeDeliveryAbove == null
            ? null
            : new Prisma.Decimal(input.freeDeliveryAbove),
      },
      include: { district: { include: { division: true } } },
    });
  }

  deleteDeliveryArea(thanaId: string) {
    return this.db.$transaction(async (tx) => {
      const thana = await tx.thana.findUnique({ where: { id: thanaId } });
      if (!thana) throw new NotFoundException('Delivery area not found');

      const [addressCount, orderCount] = await Promise.all([
        tx.address.count({ where: { thanaId } }),
        tx.order.count({ where: { shippingThanaId: thanaId } }),
      ]);
      if (addressCount > 0 || orderCount > 0) {
        throw new ConflictException(
          'This delivery area is used by saved addresses or orders. Mark it as not deliverable instead of deleting it.',
        );
      }

      await tx.thana.delete({ where: { id: thanaId } });
      const districtId = thana.districtId;
      const remainingThanas = await tx.thana.count({ where: { districtId } });
      if (remainingThanas === 0) {
        const district = await tx.district.delete({ where: { id: districtId } });
        const remainingDistricts = await tx.district.count({
          where: { divisionId: district.divisionId },
        });
        if (remainingDistricts === 0) {
          await tx.division.delete({ where: { id: district.divisionId } });
        }
      }
      return { id: thanaId, deleted: true };
    });
  }

  listDeliveryZoneConfigs() {
    return this.db.deliveryZoneConfig.findMany({ orderBy: { zone: 'asc' } });
  }

  saveDeliveryZoneConfig(input: DeliveryZoneConfigInput) {
    return this.db.deliveryZoneConfig.upsert({
      where: { zone: input.zone },
      create: {
        zone: input.zone,
        flatFee: new Prisma.Decimal(input.flatFee),
        isFree: input.isFree,
        minOrderFree:
          input.minOrderFree == null
            ? null
            : new Prisma.Decimal(input.minOrderFree),
        estimatedDaysMin: input.estimatedDaysMin ?? null,
        estimatedDaysMax: input.estimatedDaysMax ?? null,
        isActive: input.isActive,
      },
      update: {
        flatFee: new Prisma.Decimal(input.flatFee),
        isFree: input.isFree,
        minOrderFree:
          input.minOrderFree == null
            ? null
            : new Prisma.Decimal(input.minOrderFree),
        estimatedDaysMin: input.estimatedDaysMin ?? null,
        estimatedDaysMax: input.estimatedDaysMax ?? null,
        isActive: input.isActive,
      },
    });
  }

  private async releaseReservedStock(
    tx: Prisma.TransactionClient,
    items: Array<{
      id: string;
      variantId: string | null;
      quantity: number;
      stockReserved: boolean;
    }>,
  ) {
    const reservedItems = items.filter(
      (item) => item.stockReserved && item.variantId,
    );
    if (!reservedItems.length) return;

    await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE "product_variants" AS variant
      SET "stockQty" = variant."stockQty" + reserved.quantity,
          "stockStatus" = CASE
            WHEN variant."stockStatus" = 'OUT_OF_STOCK' AND variant."stockQty" = 0 THEN
              CASE WHEN reserved.quantity <= variant."lowStockAlertQty"
                THEN 'LOW_STOCK'::"StockStatus" ELSE 'IN_STOCK'::"StockStatus" END
            ELSE variant."stockStatus"
          END
      FROM (VALUES ${Prisma.join(
        reservedItems.map(
          (item) =>
            Prisma.sql`(${item.variantId}::uuid, ${item.quantity}::integer)`,
        ),
      )}) AS reserved(id, quantity)
      WHERE variant."id" = reserved.id
      RETURNING variant."id" AS id
    `);
    await tx.orderItem.updateMany({
      where: {
        id: { in: reservedItems.map((item) => item.id) },
        stockReserved: true,
      },
      data: { stockReserved: false },
    });
  }

  private reserveStock(
    tx: Prisma.TransactionClient,
    items: Array<{
      quantity: number;
      variant: { id: string };
    }>,
  ) {
    return tx
      .$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
      UPDATE "product_variants" AS variant
      SET "stockQty" = variant."stockQty" - requested.quantity
      FROM (VALUES ${Prisma.join(
        items.map(
          (item) =>
            Prisma.sql`(${item.variant.id}::uuid, ${item.quantity}::integer)`,
        ),
      )}) AS requested(id, quantity)
      WHERE variant."id" = requested.id
        AND variant."status" = 'active'
        AND variant."deletedAt" IS NULL
        AND variant."stockQty" >= requested.quantity
        AND EXISTS (
          SELECT 1
          FROM "products" AS product
          WHERE product."id" = variant."productId"
            AND product."status" = 'active'
            AND product."deletedAt" IS NULL
        )
      RETURNING variant."id" AS id
    `,
      )
      .then((rows) => rows.map((row) => row.id));
  }
}
