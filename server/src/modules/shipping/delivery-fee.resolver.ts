import { ConflictException } from '@nestjs/common';
import { Prisma, type DeliveryZone } from '@prisma/client';

export type DeliveryFeeSource =
  | 'ZONE_ALWAYS_FREE'
  | 'THANA_OVERRIDE'
  | 'THANA_FREE_THRESHOLD'
  | 'ZONE_FREE_THRESHOLD'
  | 'ZONE_FLAT_FEE';

export type DeliveryFeeResolution = {
  fee: Prisma.Decimal;
  source: DeliveryFeeSource;
};

export function resolveDeliveryFee(
  thana: {
    shippingFee: Prisma.Decimal | null;
    freeDeliveryAbove: Prisma.Decimal | null;
    deliveryZone: DeliveryZone;
  },
  zoneConfig: {
    flatFee: Prisma.Decimal;
    isFree: boolean;
    minOrderFree: Prisma.Decimal | null;
    isActive: boolean;
  } | null,
  orderAmount: Prisma.Decimal,
): DeliveryFeeResolution {
  const zero = new Prisma.Decimal(0);

  if (zoneConfig?.isActive && zoneConfig.isFree) {
    return { fee: zero, source: 'ZONE_ALWAYS_FREE' };
  }
  if (thana.shippingFee !== null) {
    return { fee: thana.shippingFee, source: 'THANA_OVERRIDE' };
  }
  if (!zoneConfig?.isActive) {
    throw new ConflictException(
      `Delivery is not configured for ${thana.deliveryZone}`,
    );
  }
  if (
    thana.freeDeliveryAbove !== null &&
    orderAmount.greaterThanOrEqualTo(thana.freeDeliveryAbove)
  ) {
    return { fee: zero, source: 'THANA_FREE_THRESHOLD' };
  }
  if (
    zoneConfig.minOrderFree !== null &&
    orderAmount.greaterThanOrEqualTo(zoneConfig.minOrderFree)
  ) {
    return { fee: zero, source: 'ZONE_FREE_THRESHOLD' };
  }

  return { fee: zoneConfig.flatFee, source: 'ZONE_FLAT_FEE' };
}
