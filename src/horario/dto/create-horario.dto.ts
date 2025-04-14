// src/horarios/dto/create-horario.dto.ts
import { IsNotEmpty, IsInt, IsDate, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { Dias } from '@prisma/client';

export class CreateHorarioDto {
  @IsIn(Object.values(Dias)) //  ¡Valida contra los valores del enum!
  @IsNotEmpty()
  dia: Dias; //  ¡Usa el enum Dias!

  @IsDate()
  @Type(() => Date) //  ¡Transforma a Date!
  @IsNotEmpty()
  hora_inicio: Date;

  @IsDate()
  @Type(() => Date) //  ¡Transforma a Date!
  @IsNotEmpty()
  hora_fin: Date;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  gradoSeccionId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  materiaId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  profesorId: number;
}