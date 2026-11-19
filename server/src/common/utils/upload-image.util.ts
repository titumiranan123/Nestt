import { BadRequestException } from '@nestjs/common';

export type MultipartFile = {
  buffer: Buffer<ArrayBuffer>;
  mimetype: string;
  size: number;
};

const signatures: Record<string, (data: Buffer) => boolean> = {
  'image/jpeg': (data) =>
    data.subarray(0, 3).equals(Buffer.from([255, 216, 255])),
  'image/png': (data) =>
    data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (data) =>
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP',
  'image/gif': (data) =>
    ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6)),
};

export function validateImage(
  file: MultipartFile | undefined,
  allowedTypes: readonly string[],
): MultipartFile {
  if (
    !file ||
    !allowedTypes.includes(file.mimetype) ||
    !signatures[file.mimetype]?.(file.buffer)
  ) {
    throw new BadRequestException(
      'Upload a valid image in a supported format.',
    );
  }
  return file;
}
