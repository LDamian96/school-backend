// src/tareas/dto/create-tarea.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDate,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTareaDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaEntrega: Date;

  @IsString()
  @IsOptional()
  calificacion?: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  materiaId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  gradoSeccionId: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  profesorId?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  estudianteId?: number;

  @IsBoolean()
  @IsOptional()
  entrego?: boolean;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  trimestreId: number;
}