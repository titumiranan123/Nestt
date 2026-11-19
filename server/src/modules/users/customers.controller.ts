import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleEnum } from '@prisma/client';
import { Readable } from 'node:stream';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { MultipartFile } from '../../common/utils/upload-image.util.js';
import { CustomersService } from './customers.service.js';
import {
  createCustomerSchema,
  CUSTOMER_AVATAR_LIMIT,
  exportCustomersSchema,
  listCustomersSchema,
  updateCustomerSchema,
} from './dto/customer.schemas.js';
import type {
  CreateCustomer,
  ExportCustomers,
  ListCustomers,
  UpdateCustomer,
} from './dto/customer.schemas.js';

const uploadAvatar = FileInterceptor('avatar', {
  limits: { fileSize: CUSTOMER_AVATAR_LIMIT + 1, fields: 1, fieldSize: 4096 },
});

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermissions('customers:read')
  list(
    @Query(new ZodValidationPipe(listCustomersSchema)) query: ListCustomers,
  ) {
    return this.customers.list(query);
  }

  @Get('export')
  @RequirePermissions('customers:export')
  exportCsv(
    @Query(new ZodValidationPipe(exportCustomersSchema)) query: ExportCustomers,
  ) {
    return new StreamableFile(Readable.from(this.customers.exportCsv(query)), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="nestt-customers.csv"',
    });
  }

  @Get(':id/avatar')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @RequirePermissions('customers:read')
  async avatar(@Param('id', ParseUUIDPipe) id: string) {
    const { bytes, mimeType } = await this.customers.avatar(id);
    return new StreamableFile(bytes, { type: mimeType });
  }

  @Post()
  @RequirePermissions('customers:create')
  @UseInterceptors(uploadAvatar)
  create(
    @Body('profile', new ZodValidationPipe(createCustomerSchema))
    input: CreateCustomer,
    @Req() request: AuthRequest,
    @UploadedFile() file?: MultipartFile,
  ) {
    return this.customers.create(input, request, file);
  }

  @Patch(':id')
  @RequirePermissions('customers:update')
  @UseInterceptors(uploadAvatar)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('profile', new ZodValidationPipe(updateCustomerSchema))
    input: UpdateCustomer,
    @Req() request: AuthRequest,
    @UploadedFile() file?: MultipartFile,
  ) {
    return this.customers.update(id, input, request, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('customers:delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthRequest) {
    return this.customers.remove(id, request);
  }
}
