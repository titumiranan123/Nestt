import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthRequest } from './jwt-auth.guard.js';
import { TokenService } from '../../modules/auth/services/token.service.js';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(tokens: TokenService) { super(tokens); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.headers.authorization) return true;
    return super.canActivate(context);
  }
}
