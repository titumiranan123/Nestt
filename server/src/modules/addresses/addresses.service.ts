import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateAddress, UpdateAddress } from './address.schemas.js';

@Injectable()
export class AddressesService {
  constructor(private readonly db: PrismaService) {}

  list(userId: string) {
    return this.db.address.findMany({
      where: { userId },
      include: { thana: { include: { district: { include: { division: true } } } } },
      orderBy: [
        { isDefaultShipping: 'desc' },
        { isDefaultBilling: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  create(userId: string, input: CreateAddress) {
    return this.db.$transaction(async (tx) => {
      const thana = await tx.thana.findUnique({
        where: { id: input.thanaId },
        include: { district: { include: { division: true } } },
      });
      if (!thana) throw new NotFoundException('Delivery area not found');

      const existingCount = await tx.address.count({ where: { userId } });
      const isDefaultShipping = input.isDefaultShipping ?? existingCount === 0;
      const isDefaultBilling = input.isDefaultBilling ?? existingCount === 0;
      if (isDefaultShipping) {
        await tx.address.updateMany({ where: { userId }, data: { isDefaultShipping: false } });
      }
      if (isDefaultBilling) {
        await tx.address.updateMany({ where: { userId }, data: { isDefaultBilling: false } });
      }

      return tx.address.create({
        data: {
          userId,
          label: input.label,
          fullName: input.fullName,
          phone: input.phone,
          thanaId: thana.id,
          region: thana.district.division.name,
          city: thana.district.name,
          area: thana.name,
          addressLine: input.addressLine,
          postalCode: input.postalCode,
          isDefaultShipping,
          isDefaultBilling,
        },
        include: { thana: { include: { district: { include: { division: true } } } } },
      });
    });
  }

  update(userId: string, id: string, input: UpdateAddress) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.address.findFirst({ where: { id, userId } });
      if (!current) throw new NotFoundException('Address not found');

      const thanaId = input.thanaId ?? current.thanaId;
      const thana = thanaId
        ? await tx.thana.findUnique({
            where: { id: thanaId },
            include: { district: { include: { division: true } } },
          })
        : null;
      if (!thana) throw new NotFoundException('Select a delivery area for this address');

      if (input.isDefaultShipping === true) {
        await tx.address.updateMany({ where: { userId }, data: { isDefaultShipping: false } });
      }
      if (input.isDefaultBilling === true) {
        await tx.address.updateMany({ where: { userId }, data: { isDefaultBilling: false } });
      }

      return tx.address.update({
        where: { id },
        data: {
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
          ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
          ...(input.isDefaultShipping !== undefined ? { isDefaultShipping: input.isDefaultShipping } : {}),
          ...(input.isDefaultBilling !== undefined ? { isDefaultBilling: input.isDefaultBilling } : {}),
          thanaId: thana.id,
          region: thana.district.division.name,
          city: thana.district.name,
          area: thana.name,
        },
        include: { thana: { include: { district: { include: { division: true } } } } },
      });
    });
  }

  remove(userId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.address.findFirst({ where: { id, userId } });
      if (!current) throw new NotFoundException('Address not found');
      await tx.address.delete({ where: { id } });

      const remaining = await tx.address.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (remaining.length > 0 && current.isDefaultShipping) {
        await tx.address.update({ where: { id: remaining[0].id }, data: { isDefaultShipping: true } });
      }
      if (remaining.length > 0 && current.isDefaultBilling) {
        await tx.address.update({ where: { id: remaining[0].id }, data: { isDefaultBilling: true } });
      }
      return { id, deleted: true };
    });
  }
}
