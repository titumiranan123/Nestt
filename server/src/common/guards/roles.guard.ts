import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleEnum } from '@prisma/client';
import type { AuthRequest } from './jwt-auth.guard.js';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<AuthRequest>();

    if (
      !roles?.length ||
      !request.authUserId ||
      !roles.includes(request.authUserRole)
    ) {
      throw new ForbiddenException('Required role access denied');
    }
    return true;
  }
}
