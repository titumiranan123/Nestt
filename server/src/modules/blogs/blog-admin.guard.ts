import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Injectable()
export class BlogAdminGuard extends RolesGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }
}
