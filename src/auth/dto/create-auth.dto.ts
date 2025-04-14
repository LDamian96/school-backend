import { Role } from "@prisma/client";
import { IsArray, IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateAuthDto {

  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;

    @IsString()
    @MinLength(1)
    fullName: string;
    @IsIn(Object.values(Role), { each: true, message: 'Rol inválido' }) //  ¡Valida contra el enum Role!
    @IsArray()
  @IsOptional() //  Los roles son opcionales al crear
  //@IsIn(Object.values(validRoles), { each: true }) //  Valida contra el enum de roles, cada elemento del array.
  roles?: Role[]; 
}
