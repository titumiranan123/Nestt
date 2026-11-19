import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const orderNumberSettingId = 1;

export async function allocateOrderCode(
  tx: Prisma.TransactionClient,
  fallback: string,
) {
  // Orders and settings writes lock the same row. Rollbacks also roll back the counter.
  while (true) {
    const [allocation] = await tx.$queryRaw<{ code: string }[]>`
      UPDATE "order_number_settings"
      SET "next_number" = GREATEST("next_number", "start_number") + 1
      WHERE "id" = ${orderNumberSettingId}
      RETURNING "prefix" || ("next_number" - 1)::text || "suffix" AS code
    `;
    if (!allocation) return fallback;
    if (allocation.code.length > 30) {
      throw new ConflictException(
        'The order number is too long. Shorten the order prefix or suffix in General Settings.',
      );
    }
    if (
      !(await tx.order.findUnique({
        where: { orderCode: allocation.code },
        select: { id: true },
      }))
    ) {
      return allocation.code;
    }
  }
}
