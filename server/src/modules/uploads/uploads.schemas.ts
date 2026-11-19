import { z } from 'zod';

export const IMAGE_LIMIT = 10 * 1024 * 1024;
export const VIDEO_CHUNK_SIZE = 5 * 1024 * 1024;
export const VIDEO_LIMIT = 100 * 1024 * 1024;

const name = z.string().trim().min(1).max(255);

export const imageUploadSchema = z.strictObject({
  id: z.uuid(),
  batchId: z.uuid(),
  name,
  position: z.coerce.number().int().min(0).max(2_147_483_647),
  primary: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const videoUploadSchema = z.strictObject({
  id: z.uuid(),
  name,
  size: z.number().int().min(12).max(VIDEO_LIMIT),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;
