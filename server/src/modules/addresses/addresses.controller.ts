import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AddressesService } from './addresses.service.js';
import { createAddressSchema, updateAddressSchema } from './address.schemas.js';
import type { CreateAddress, UpdateAddress } from './address.schemas.js';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.addresses.list(req.authUserId);
  }

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(createAddressSchema)) body: CreateAddress,
  ) {
    return this.addresses.create(req.authUserId, body);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAddressSchema)) body: UpdateAddress,
  ) {
    return this.addresses.update(req.authUserId, id, body);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.addresses.remove(req.authUserId, id);
  }
}
