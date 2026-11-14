import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { throwMappedPrismaError } from './prisma-error.util.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('database error', {
    code,
    clientVersion: 'test',
  });

describe('Prisma error mapper', () => {
  it('maps unique, missing-record, and foreign-key errors to resource messages', () => {
    expect(() =>
      throwMappedPrismaError(prismaError('P2002'), { unique: 'duplicate' }),
    ).toThrow(new ConflictException('duplicate'));
    expect(() =>
      throwMappedPrismaError(prismaError('P2025'), { notFound: 'missing' }),
    ).toThrow(new NotFoundException('missing'));
    expect(() =>
      throwMappedPrismaError(prismaError('P2003'), {
        foreignKey: 'bad relation',
      }),
    ).toThrow(new BadRequestException('bad relation'));
  });

  it('passes through unmapped and non-Prisma errors unchanged', () => {
    const unknown = prismaError('P1000');
    expect(() =>
      throwMappedPrismaError(unknown, { unique: 'duplicate' }),
    ).toThrow(unknown);
    const failure = new Error('database unavailable');
    expect(() => throwMappedPrismaError(failure, {})).toThrow(failure);
    const unmapped = prismaError('P2003');
    expect(() => throwMappedPrismaError(unmapped, {})).toThrow(unmapped);
  });
});
