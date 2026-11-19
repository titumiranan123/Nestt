import { RoleEnum, type Prisma } from '@prisma/client';

export const customerScope = {
  role: RoleEnum.CUSTOMER,
  customerDeletedAt: null,
} satisfies Prisma.UserWhereInput;
