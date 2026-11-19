import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { UploadsService } from './uploads.service.js';

function byteRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end =
    match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (start >= size || start > end) return null;
  return { start, end };
}

@Controller('media')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Get(':id')
  async read(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('range') range: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const upload = await this.uploads.published(id);
    const bounds = range
      ? byteRange(range, upload.size)
      : { start: 0, end: upload.size - 1 };
    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!bounds) {
      response.setHeader('Content-Range', `bytes */${upload.size}`);
      response.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
      return;
    }
    const { start, end } = bounds;
    if (range) {
      response.status(HttpStatus.PARTIAL_CONTENT);
      response.setHeader(
        'Content-Range',
        `bytes ${start}-${end}/${upload.size}`,
      );
    }
    return new StreamableFile(this.uploads.stream(upload, start, end), {
      type: upload.mimeType,
      length: end - start + 1,
    });
  }
}
