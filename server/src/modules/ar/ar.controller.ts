import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { saveARDesignSchema, updateARDesignSchema } from './dto/ar-design.schemas.js';
import type { SaveARDesign, UpdateARDesign } from './dto/ar-design.schemas.js';
import { ARService } from './ar.service.js';

@Controller('ar')
export class ARController {
  constructor(private readonly ar: ARService) {}

  @Get('catalog')
  catalog() { return this.ar.catalog(); }

  @Post('designs')
  @UseGuards(OptionalJwtAuthGuard)
  create(@Req() req: AuthRequest, @Body(new ZodValidationPipe(saveARDesignSchema)) body: SaveARDesign) {
    return this.ar.create(body, req.authUserId);
  }

  @Get('designs/mine')
  @UseGuards(JwtAuthGuard)
  listMine(@Req() req: AuthRequest) { return this.ar.listMine(req.authUserId); }

  @Get('designs/share/:shareId')
  getShared(@Param('shareId') shareId: string) { return this.ar.getShared(shareId); }

  @Patch('designs/:id')
  @UseGuards(OptionalJwtAuthGuard)
  update(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-design-edit-token') editToken: string | undefined,
    @Body(new ZodValidationPipe(updateARDesignSchema)) body: UpdateARDesign,
  ) { return this.ar.update(id, body, req.authUserId, editToken); }

  @Delete('designs/:id')
  @UseGuards(OptionalJwtAuthGuard)
  remove(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-design-edit-token') editToken: string | undefined,
  ) { return this.ar.remove(id, req.authUserId, editToken); }
}
