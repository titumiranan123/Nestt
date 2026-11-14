import { SetMetadata } from '@nestjs/common';
import type { RoleEnum } from '@prisma/client';

export const ROLES_METADATA_KEY = 'required_roles';

export const Roles = (...roles: RoleEnum[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);
