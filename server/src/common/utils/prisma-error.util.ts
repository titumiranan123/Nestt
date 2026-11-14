import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type PrismaErrorMessages = {
  unique?: string;
  notFound?: string;
  foreignKey?: string;
};

export function throwMappedPrismaError(
  error: unknown,
  messages: PrismaErrorMessages,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002' && messages.unique) {
      throw new ConflictException(messages.unique);
    }
    if (error.code === 'P2025' && messages.notFound) {
      throw new NotFoundException(messages.notFound);
    }
    if (error.code === 'P2003' && messages.foreignKey) {
      throw new BadRequestException(messages.foreignKey);
    }
  }
  throw error;
}
