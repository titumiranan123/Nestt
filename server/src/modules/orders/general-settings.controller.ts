import {
  Body,
  Controller,
  Get,
  Injectable,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { z } from 'zod';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  policySettingKeys,
  policySettingSchema,
} from '../blogs/dto/blog.schemas.js';
import { orderNumberSettingId } from './order-numbering.js';

const orderCodePart = z
  .string()
  .trim()
  .max(10)
  .regex(/^[A-Za-z0-9_-]*$/, 'Use letters, digits, hyphens or underscores.');
const saveSettingsSchema = z
  .strictObject({
    policies: z
      .array(policySettingSchema)
      .max(policySettingKeys.length)
      .default([]),
    orderFormat: z
      .strictObject({
        prefix: orderCodePart,
        suffix: orderCodePart,
        startNumber: z.number().int().min(1).max(999_999_999),
      })
      .optional(),
  })
  .refine(
    ({ policies }) =>
      new Set(policies.map(({ key }) => key)).size === policies.length,
    {
      path: ['policies'],
      message: 'Each policy may only be updated once per request.',
    },
  );

@Injectable()
export class GeneralSettingsService {
  constructor(private readonly db: PrismaService) {}

  async get() {
    const [policies, format] = await this.db.$transaction([
      this.db.storeSetting.findMany({
        where: { key: { in: [...policySettingKeys] } },
        select: { key: true, value: true, updatedAt: true },
        orderBy: { key: 'asc' },
      }),
      this.db.orderNumberSetting.findUnique({
        where: { id: orderNumberSettingId },
      }),
    ]);
    return {
      policies,
      orderFormat: format
        ? {
            prefix: format.prefix,
            suffix: format.suffix,
            startNumber: format.startNumber,
            nextNumber: (format.nextNumber > BigInt(format.startNumber)
              ? format.nextNumber
              : BigInt(format.startNumber)
            ).toString(),
          }
        : null,
    };
  }

  async save({ orderFormat, policies }: z.infer<typeof saveSettingsSchema>) {
    await this.db.$transaction(async (tx) => {
      for (const { key, value } of [...policies].sort((a, b) =>
        a.key.localeCompare(b.key),
      )) {
        await tx.storeSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
      if (orderFormat) {
        await tx.orderNumberSetting.upsert({
          where: { id: orderNumberSettingId },
          create: {
            id: orderNumberSettingId,
            ...orderFormat,
            nextNumber: BigInt(orderFormat.startNumber),
          },
          update: orderFormat,
        });
      }
    });
    return this.get();
  }
}

@Controller('admin/general-settings')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class GeneralSettingsController {
  constructor(private readonly settings: GeneralSettingsService) {}

  @Get()
  @RequirePermissions('settings:read')
  get() {
    return this.settings.get();
  }

  @Put()
  @RequirePermissions('settings:update')
  save(
    @Body(new ZodValidationPipe(saveSettingsSchema))
    body: z.infer<typeof saveSettingsSchema>,
  ) {
    return this.settings.save(body);
  }
}
