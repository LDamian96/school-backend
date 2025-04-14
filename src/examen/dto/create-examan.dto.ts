// src/examenes/dto/create-examen.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDate, //  ¡Usamos IsDate!
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer'; //  ¡IMPORTANTE!

export class CreateExamenDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsDate()          //  ¡Valida que sea un objeto Date!
  @Type(() => Date)  //  ¡TRANSFORMA a Date!
  @IsNotEmpty()
  fecha: Date;      //  ¡Tipo Date!

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  materiaId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  gradoSeccionId: number;

  @IsInt()
 
  @IsOptional()
  profesorId?: number;

  @IsInt()
  
  @IsOptional()
  estudianteId?: number;

  @IsInt()
  @IsOptional()
  horarioId?: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  trimestreId: number;

  @IsString()
  @IsOptional()
  nota?: string;
}