import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  BulkThanaInput,
  DistrictInput,
  DivisionInput,
  ThanaInput,
  UpdateThanaInput,
} from './dto/delivery-admin.schemas.js';

type RowId = { id: string };

@Injectable()
export class DeliveryLocationService {
  constructor(private readonly db: PrismaService) {}

  createDivision(input: DivisionInput) {
    return this.write(this.db.division.create({ data: input }));
  }

  updateDivision(id: string, input: DivisionInput) {
    return this.write(this.db.division.update({ where: { id }, data: input }));
  }

  createDistrict(input: DistrictInput) {
    return this.write(this.db.district.create({ data: input }));
  }

  updateDistrict(id: string, input: DistrictInput) {
    return this.write(this.db.district.update({ where: { id }, data: input }));
  }

  createThana(input: ThanaInput) {
    return this.write(this.db.thana.create({ data: input }));
  }

  updateThana(id: string, input: UpdateThanaInput) {
    return this.write(this.db.thana.update({ where: { id }, data: input }));
  }

  async bulkUpdateThanas({ thanaIds, ...data }: BulkThanaInput) {
    const uniqueIds = [...new Set(thanaIds)];
    return this.db.$transaction(async (tx) => {
      const { count } = await tx.thana.updateMany({
        where: { id: { in: uniqueIds } },
        data,
      });
      if (count !== uniqueIds.length) {
        throw new NotFoundException(
          'One or more selected thanas no longer exist.',
        );
      }
      return { updatedCount: count };
    });
  }

  deleteDivision(id: string) {
    return this.write(
      this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM divisions WHERE id = ${id}::uuid FOR UPDATE`;
        const districts = await tx.$queryRaw<RowId[]>`
        SELECT id FROM districts WHERE "divisionId" = ${id}::uuid ORDER BY id FOR UPDATE
      `;
        await this.deleteThanas(
          tx,
          Prisma.sql`"districtId" IN (
        SELECT id FROM districts WHERE "divisionId" = ${id}::uuid
      )`,
        );
        await tx.district.deleteMany({
          where: { id: { in: districts.map((district) => district.id) } },
        });
        await tx.division.delete({ where: { id } });
        return { id, deleted: true };
      }),
    );
  }

  deleteDistrict(id: string) {
    return this.write(
      this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM districts WHERE id = ${id}::uuid FOR UPDATE`;
        await this.deleteThanas(tx, Prisma.sql`"districtId" = ${id}::uuid`);
        await tx.district.delete({ where: { id } });
        return { id, deleted: true };
      }),
    );
  }

  deleteThana(id: string) {
    return this.write(
      this.db.$transaction(async (tx) => {
        const count = await this.deleteThanas(tx, Prisma.sql`id = ${id}::uuid`);
        if (count === 0)
          throw new NotFoundException('Delivery area not found.');
        return { id, deleted: true };
      }),
    );
  }

  private async deleteThanas(tx: Prisma.TransactionClient, filter: Prisma.Sql) {
    // Lock the FK targets so a concurrent address or order cannot attach after the checks.
    const rows = await tx.$queryRaw<
      RowId[]
    >`SELECT id FROM thanas WHERE ${filter} ORDER BY id FOR UPDATE`;
    if (rows.length === 0) return 0;

    const ids = { in: rows.map(({ id }) => id) };
    const [addresses, orders] = await Promise.all([
      tx.address.count({ where: { thanaId: ids } }),
      tx.order.count({ where: { shippingThanaId: ids } }),
    ]);
    if (addresses || orders) {
      throw new ConflictException(
        'A delivery area is used by saved addresses or orders. Mark it as blocked to stop new deliveries.',
      );
    }

    const { count } = await tx.thana.deleteMany({ where: { id: ids } });
    return count;
  }

  private write<T>(result: Promise<T>) {
    return result.catch((error: unknown) =>
      throwMappedPrismaError(error, {
        unique: 'A location with this name already exists here.',
        notFound: 'The selected location no longer exists.',
        foreignKey: 'The related location no longer exists or is still in use.',
      }),
    );
  }
}
