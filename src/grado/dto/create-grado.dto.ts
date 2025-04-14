// src/system-schools/dto/create-grado-seccion.dto.ts
import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { Nivel } from '@prisma/client'; //  ¡Importa el enum Nivel!

export class CreateGradoSeccionDto {
  @IsString()
  @IsNotEmpty()
  grado: string;

  @IsString()
  @IsNotEmpty()
  seccion: string;

  @IsNotEmpty()
  @IsIn(Object.values(Nivel)) //  ¡Valida contra los valores del enum!
  nivel: Nivel;
}