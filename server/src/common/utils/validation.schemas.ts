import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Set `enforceFormat` when the API contract requires a lowercase kebab-case slug. */
export function slugSchema(maxLength: number, enforceFormat = false) {
  const schema = z.string().trim().min(1).max(maxLength);
  return enforceFormat ? schema.regex(SLUG_PATTERN) : schema;
}
