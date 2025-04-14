// src/trimestres/dto/create-trimestre.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsPositive } from 'class-validator';
import { Nivel } from '@prisma/client'; // Importa el enum Nivel


export class CreateTrimestreDto {
  @IsString()
  @IsNotEmpty()
  trimestre: string;

  @IsInt()
  @IsPositive()
  @IsOptional() // Opcional porque un trimestre puede no estar asociado a un gradoSeccion desde el principio.
  gradoSeccionId?: number;

}