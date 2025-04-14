// src/asistencias/dto/create-asistencia.dto.ts
import {
    IsString,
    IsNotEmpty,
    IsInt,
    IsOptional,
    IsDate,  // Para validación de fecha
    IsPositive,
    IsBoolean,
  } from 'class-validator';
  import { Type } from 'class-transformer'; // ¡Importante para la transformación!
  
  export class CreateAsistenciaDto {
    @IsString()
    @IsNotEmpty()
    estado: string;  // "Asistió", "No Asistió", "Tardanza", etc.
  
    @IsDate()      // ¡Valida que sea un objeto Date!
    @Type(() => Date) // ¡TRANSFORMA a Date!
    @IsNotEmpty()
    fecha: Date;    //  ¡Usa Date!
  
    @IsInt()
    @IsPositive()
    @IsOptional() // Un registro de asistencia puede ser individual o para todo el grado/sección
    estudianteId?: number;
  
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
    @IsOptional() //  El profesor *podría* no estar presente al crear la asistencia
    profesorId?: number;
  
    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    trimestreId: number;
  
    @IsBoolean()
    @IsOptional()//Por defecto es false
    asistio?: boolean = false; //  ¡Nuevo campo booleano!
  }