import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { MediaUploadKind, Prisma } from '@prisma/client';
import type { MediaUpload } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { validateImage } from '../../common/utils/upload-image.util.js';
import type { MultipartFile } from '../../common/utils/upload-image.util.js';
import { IMAGE_LIMIT, VIDEO_CHUNK_SIZE } from './uploads.schemas.js';
import type { ImageUploadInput, VideoUploadInput } from './uploads.schemas.js';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const incompleteUploadTtl = 24 * 60 * 60 * 1000;

@Injectable()
export class UploadsService {
  constructor(private readonly db: PrismaService) {}

  async uploadImage(
    ownerId: string,
    input: ImageUploadInput,
    incoming?: MultipartFile,
  ) {
    const file = validateImage(incoming, imageTypes);
    if (file.size > IMAGE_LIMIT)
      throw new PayloadTooLargeException('Images must be 10 MB or smaller.');
    const { id, batchId, name, position, primary } = input;
    await this.db.$transaction(async (tx) => {
      const { count } = await tx.mediaUpload.createMany({
        data: {
          id,
          ownerId,
          batchId,
          name,
          position,
          isPrimary: primary,
          kind: MediaUploadKind.IMAGE,
          mimeType: file.mimetype,
          size: file.size,
          completedAt: new Date(),
        },
        skipDuplicates: true,
      });
      if (count) {
        await tx.mediaUploadChunk.create({
          data: { uploadId: id, index: 0, bytes: file.buffer },
        });
        return;
      }
      const existing = await tx.mediaUpload.findFirst({
        where: {
          id,
          ownerId,
          kind: MediaUploadKind.IMAGE,
          batchId,
          name,
          position,
          isPrimary: primary,
          size: file.size,
          mimeType: file.mimetype,
        },
        select: { id: true },
      });
      if (!existing)
        throw new ConflictException(
          'The image upload conflicts with an existing upload.',
        );
    });
    return this.result(id);
  }

  async startVideo(ownerId: string, input: VideoUploadInput) {
    await this.db.mediaUpload.deleteMany({
      where: {
        ownerId,
        completedAt: null,
        updatedAt: { lt: new Date(Date.now() - incompleteUploadTtl) },
      },
    });
    const { id, name, size } = input;
    await this.db.mediaUpload.createMany({
      data: {
        id,
        ownerId,
        name,
        size,
        kind: MediaUploadKind.VIDEO,
        mimeType: 'video/mp4',
      },
      skipDuplicates: true,
    });
    const upload = await this.db.mediaUpload.findUniqueOrThrow({ where: { id } });
    if (
      upload.ownerId !== ownerId ||
      upload.kind !== MediaUploadKind.VIDEO ||
      upload.name !== name ||
      upload.size !== size
    ) {
      throw new ConflictException(
        'The video upload conflicts with an existing upload.',
      );
    }
    return { id };
  }

  async saveVideoChunk(
    ownerId: string,
    id: string,
    index: number,
    file?: MultipartFile,
  ) {
    await this.db.$transaction(async (tx) => {
      const upload = await this.lockVideo(tx, ownerId, id);
      const expectedSize = Math.min(
        VIDEO_CHUNK_SIZE,
        upload.size - index * VIDEO_CHUNK_SIZE,
      );
      if (
        !file ||
        index < 0 ||
        expectedSize <= 0 ||
        file.size !== expectedSize
      ) {
        throw new BadRequestException(
          'The video chunk index or size is invalid.',
        );
      }
      if (index === 0 && file.buffer.toString('ascii', 4, 8) !== 'ftyp') {
        throw new BadRequestException('Upload a valid MP4 video.');
      }
      if (!upload.completedAt) {
        await tx.mediaUploadChunk.upsert({
          where: { uploadId_index: { uploadId: id, index } },
          create: { uploadId: id, index, bytes: file.buffer },
          update: { bytes: file.buffer },
        });
      }
    });
  }

  async finishVideo(ownerId: string, id: string) {
    await this.db.$transaction(async (tx) => {
      const upload = await this.lockVideo(tx, ownerId, id);
      if (upload.completedAt) return;
      const chunks = await tx.mediaUploadChunk.count({
        where: { uploadId: id },
      });
      if (chunks !== Math.ceil(upload.size / VIDEO_CHUNK_SIZE)) {
        throw new ConflictException(
          'Upload all video chunks before publishing.',
        );
      }
      await tx.mediaUpload.update({
        where: { id },
        data: { completedAt: new Date() },
      });
    });
    return this.result(id);
  }

  async published(id: string) {
    const upload = await this.db.mediaUpload.findFirst({
      where: { id, completedAt: { not: null } },
    });
    if (!upload) throw new NotFoundException('Media was not found.');
    return upload;
  }

  stream(upload: MediaUpload, start: number, end: number): Readable {
    return Readable.from(this.readChunks(upload, start, end), {
      objectMode: false,
    });
  }

  private async *readChunks(upload: MediaUpload, start: number, end: number) {
    const chunkSize =
      upload.kind === MediaUploadKind.VIDEO ? VIDEO_CHUNK_SIZE : upload.size;
    const last = Math.floor(end / chunkSize);
    for (let index = Math.floor(start / chunkSize); index <= last; index += 1) {
      const { bytes } = await this.db.mediaUploadChunk.findUniqueOrThrow({
        where: { uploadId_index: { uploadId: upload.id, index } },
        select: { bytes: true },
      });
      const offset = index * chunkSize;
      yield Buffer.from(
        bytes.subarray(Math.max(start - offset, 0), end - offset + 1),
      );
    }
  }

  private async lockVideo(
    tx: Prisma.TransactionClient,
    ownerId: string,
    id: string,
  ) {
    try {
      // Serialize chunk writes and publication on the upload row.
      return await tx.mediaUpload.update({
        where: { id, ownerId, kind: MediaUploadKind.VIDEO },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Video upload was not found.');
      }
      throw error;
    }
  }

  private result(id: string) {
    return { id, path: `/media/${id}` };
  }
}
