// src/profesores/dto/create-profesor.dto.ts
import { Role, UserSex } from '@prisma/client';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsBoolean,
    IsOptional,
    MinLength,
    MaxLength,
    IsIn,
    IsArray,
} from 'class-validator';

export class CreateProfesorDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(20)
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
    @IsIn(Object.values(Role), { each: true, message: 'Rol inválido' }) //  ¡Valida contra el enum Role!
        @IsArray()
      @IsOptional() //  Los roles son opcionales al crear
      //@IsIn(Object.values(validRoles), { each: true }) //  Valida contra el enum de roles, cada elemento del array.
      roles?: Role[]; 
    
      @IsIn(Object.values(UserSex)) //  ¡Valida contra los valores del enum!
      @IsNotEmpty()
      sex: UserSex; //  ¡Usa el enum Dias!
    
}