import {
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
import type {
  DeliveryAreaInput,
  DeliveryZoneConfigInput,
  CreateOrder,
  CreateOrderRemark,
  ListOrders,
  RequestReturn,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateReturnStatus,
} from './dto/order.schemas.js';
import { resolveDeliveryFee } from '../shipping/delivery-fee.resolver.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  paginationOffset,
  paginationResult,
} from '../../common/utils/pagination.js';

const orderDetails = {
  items: true,
  payment: { include: { transactions: { orderBy: { createdAt: 'desc' as const } } } },
  statusHistories: { orderBy: { createdAt: 'asc' as const } },
  returns: { include: { item: true }, orderBy: { createdAt: 'desc' as const } },
  remarks: { orderBy: { createdAt: 'desc' as const } },
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: PrismaService) {}

  createCheckout(userId: string, orderCode: string, input: CreateOrder) {
    return this.db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: input.items.map((item) => item.variantId) },
          status: 'active',
          deletedAt: null,
          product: { is: { status: 'active', deletedAt: null } },
        },
        include: {
          product: true,
          media: {
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            take: 1,
          },
        },
      });
      if (variants.length !== input.items.length) {
        throw new NotFoundException('One or more products are unavailable');
      }

      const savedAddress = input.addressId
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
      if (!address.thanaId) {
        throw new ConflictException(
          'Select a delivery area for this saved address before checkout',
        );
      }

      const thana = await tx.thana.findUnique({
        where: { id: address.thanaId },
        include: { district: { include: { division: true } } },
      });
      if (!thana?.isDeliverable)
        throw new ConflictException('Delivery is not available for this area');

      const variantsById = new Map(
        variants.map((variant) => [variant.id, variant]),
      );
      const items = input.items.map((item) => {
        const variant = variantsById.get(item.variantId);
        if (!variant)
          throw new NotFoundException('One or more products are unavailable');
        return { ...item, variant, total: variant.price.mul(item.quantity) };
      });
      const subTotal = items.reduce(
        (sum, item) => sum.add(item.total),
        new Prisma.Decimal(0),
      );
      const zoneConfig = await tx.deliveryZoneConfig.findUnique({
        where: { zone: thana.deliveryZone },
      });
      const deliveryFee = resolveDeliveryFee(thana, zoneConfig, subTotal);
      const shippingCharge = deliveryFee.fee;
      const totalAmount = subTotal.add(shippingCharge);

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
        phone: address.phone,
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

      return tx.order.create({
        data: {
          orderCode,
          userId,
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
          statusHistories: {
            where: { isPublic: true },
            orderBy: { createdAt: 'asc' },
          },
        },
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
        ...orderDetails,
        statusHistories: {
          where: { isPublic: true },
          orderBy: { createdAt: 'asc' },
        },
        remarks: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
        },
      },
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

  listAll(query: ListOrders) {
    const where = query.status ? { status: query.status } : {};
    return this.db.$transaction(async (tx) => {
      const [orders, total] = await Promise.all([
        tx.order.findMany({
          where,
          include: { items: true, payment: true },
          orderBy: { createdAt: 'desc' },
          skip: paginationOffset(query.page, query.pageSize),
          take: query.pageSize,
        }),
        tx.order.count({ where }),
      ]);
      return paginationResult(orders, total, query.page, query.pageSize, {
        pageSizeKey: 'pageSize',
      });
    });
  }

  findById(id: string) {
    return this.db.order.findUnique({ where: { id }, include: orderDetails });
  }

  updateStatus(id: string, actorId: string, input: UpdateOrderStatus) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      const update = await tx.order.updateMany({
        where: { id, status: order.status, version: order.version },
        data: { status: input.status, version: { increment: 1 } },
      });
      if (update.count !== 1)
        throw new ConflictException('Order changed; reload and try again');
      if (input.status === OrderStatus.CANCELLED)
        await this.releaseReservedStock(tx, order.items);
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: input.status,
          changedBy: actorId,
          source: 'ADMIN',
          note: input.note,
          isPublic: input.isPublic,
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
      SET "stockQty" = variant."stockQty" + reserved.quantity
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
