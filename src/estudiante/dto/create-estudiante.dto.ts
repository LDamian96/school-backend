// src/estudiantes/dto/create-estudiante.dto.ts
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsBoolean,
    IsOptional,
    MinLength,
    MaxLength,
    IsInt, //  ¡Importante para el ID!
    IsPositive,
    IsIn, //  ¡El ID debe ser positivo!
} from 'class-validator';
import { Nivel, UserSex } from '@prisma/client'; //Importante

export class CreateEstudianteDto {
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
    @MinLength(6) // Ajusta según sea necesario
    @MaxLength(20)
    password: string;

    @IsInt()       //  ¡Debe ser un entero!
    @IsPositive()  //  ¡Debe ser positivo!
    @IsNotEmpty()  //  ¡Es obligatorio!
    gradoSeccionId: number; //  ¡Usamos gradoSeccionId directamente!

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true; //Valor por defecto.

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    address?: string;
    @IsIn(Object.values(UserSex)) //  ¡Valida contra los valores del enum!
          @IsNotEmpty()
          sex: UserSex; //  ¡Usa el enum Dias!
        
}