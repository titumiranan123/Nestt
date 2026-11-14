import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { RoleEnum } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import {
  createSeoMetaSchema,
  siteContentSchema,
  siteSitemapSchema,
  updateSeoMetaSchema,
} from './dto/seo.schemas.js';
import type {
  CreateSeoMeta,
  SiteContent,
  UpdateSeoMeta,
} from './dto/seo.schemas.js';
import { SeoService } from './seo.service.js';

@Controller('admin/seo')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class SeoAdminController {
  constructor(private readonly seo: SeoService) {}

  @Get('meta')
  @RequirePermissions('website:read')
  listMeta() {
    return this.seo.listMeta();
  }

  @Post('meta')
  @RequirePermissions('website:update')
  createMeta(
    @Body(new ZodValidationPipe(createSeoMetaSchema)) body: CreateSeoMeta,
  ) {
    return this.seo.createMeta(body);
  }

  @Put('meta/:pageName')
  @RequirePermissions('website:update')
  updateMeta(
    @Param('pageName') pageName: string,
    @Body(new ZodValidationPipe(updateSeoMetaSchema)) body: UpdateSeoMeta,
  ) {
    return this.seo.updateMeta(pageName, body);
  }

  @Delete('meta/:pageName')
  @RequirePermissions('website:update')
  deleteMeta(@Param('pageName') pageName: string) {
    return this.seo.deleteMeta(pageName);
  }

  @Get('robots')
  @RequirePermissions('website:read')
  getRobots() {
    return this.seo.getRobotsRecord();
  }

  @Put('robots')
  @RequirePermissions('website:update')
  saveRobots(
    @Body(new ZodValidationPipe(siteContentSchema)) body: SiteContent,
    @Req() req: AuthRequest,
  ) {
    return this.seo.saveRobots(body.content, req.authUserId);
  }

  @Get('sitemap')
  @RequirePermissions('website:read')
  getSitemap() {
    return this.seo.getSitemapRecord();
  }

  @Put('sitemap')
  @RequirePermissions('website:update')
  saveSitemap(
    @Body(new ZodValidationPipe(siteSitemapSchema)) body: SiteContent,
    @Req() req: AuthRequest,
  ) {
    return this.seo.saveSitemap(body.content, req.authUserId);
  }
}
