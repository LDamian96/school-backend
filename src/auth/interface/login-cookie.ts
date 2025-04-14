// src/auth/interface/login-response.interface.ts (NUEVO ARCHIVO)
import { User } from '@prisma/client'; // O donde esté definido tu tipo User

export interface LoginResponse {
  user: Omit<User, 'password'>; // Excluye la contraseña del objeto User
  token: string;
  refreshToken: string;
}