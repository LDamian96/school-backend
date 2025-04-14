// src/auth/decorators/roles-protect/roles-protect.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Importa el enum Role de Prisma
import { validRoles } from 'src/auth/interface/valid-roles';


export const META_ROLES = 'roles';

export const RoleProtected = (...args: validRoles[]) => { // Recibe un array de Role
  return SetMetadata(META_ROLES, args);
};