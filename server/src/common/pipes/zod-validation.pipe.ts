import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        issues: result.error.issues.map(({ path, message }) => ({
          path: path.join('.'),
          message,
        })),
      });
    }
    return result.data;
  }
}
