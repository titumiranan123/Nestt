import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  it('returns the parsed and transformed request data', () => {
    const pipe = new ZodValidationPipe(z.object({ count: z.coerce.number() }));
    expect(pipe.transform({ count: '4' })).toEqual({ count: 4 });
  });

  it('returns structured validation issues for invalid request bodies', () => {
    const pipe = new ZodValidationPipe(z.object({ email: z.email() }));
    try {
      pipe.transform({ email: 'bad' });
      throw new Error('Expected the validation pipe to reject the request');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: 'Invalid request body',
        issues: [{ path: 'email' }],
      });
    }
  });
});
