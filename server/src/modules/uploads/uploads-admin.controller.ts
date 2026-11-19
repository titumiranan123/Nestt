import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleEnum } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { MultipartFile } from '../../common/utils/upload-image.util.js';
import {
  IMAGE_LIMIT,
  imageUploadSchema,
  VIDEO_CHUNK_SIZE,
  videoUploadSchema,
} from './uploads.schemas.js';
import type { ImageUploadInput, VideoUploadInput } from './uploads.schemas.js';
import { UploadsService } from './uploads.service.js';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
@RequirePermissions('website:create')
export class UploadsAdminController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_LIMIT + 1, fields: 5, fieldSize: 1024 },
    }),
  )
  uploadImage(
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(imageUploadSchema)) body: ImageUploadInput,
    @UploadedFile() file?: MultipartFile,
  ) {
    return this.uploads.uploadImage(request.authUserId, body, file);
  }

  @Post('videos')
  startVideo(
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(videoUploadSchema)) body: VideoUploadInput,
  ) {
    return this.uploads.startVideo(request.authUserId, body);
  }

  @Put('videos/:id/chunks/:index')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: VIDEO_CHUNK_SIZE + 1, fields: 0 },
    }),
  )
  saveVideoChunk(
    @Req() request: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
    @UploadedFile() file?: MultipartFile,
  ) {
    return this.uploads.saveVideoChunk(request.authUserId, id, index, file);
  }

  @Post('videos/:id/complete')
  @HttpCode(HttpStatus.OK)
  finishVideo(
    @Req() request: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.uploads.finishVideo(request.authUserId, id);
  }
}
