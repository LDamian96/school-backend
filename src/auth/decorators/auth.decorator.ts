import { applyDecorators, UseGuards } from '@nestjs/common';
// import { validRoles } from '../interface/valid-roles'; // ¡YA NO!
import { RoleProtected } from './roles-protect/roles-protect.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/guards.guard';
import { Role } from '@prisma/client';
import { validRoles } from '../interface/valid-roles';

export function Auth(...roles: validRoles[]) { //  ¡Recibe strings!
  return applyDecorators(
    RoleProtected(...roles), //  ¡Pasa los roles como strings!
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}