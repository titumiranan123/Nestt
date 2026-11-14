import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleEnum } from '@prisma/client';
import { TokenService } from '../../modules/auth/services/token.service.js';

export interface AuthRequest extends Request {
  authUserId: string;
  authUserRole: RoleEnum;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Bearer token required');
    const user = await this.tokens.accessUser(match[1]);
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }
    request.authUserId = user.id;
    request.authUserRole = user.role;
    return true;
  }
}
