import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateMateriaDto{
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    profesor:string//nomre del profesor
    @IsString()
    @IsOptional()
    apellido:string
    @IsInt()
    @IsPositive()
    @IsNotEmpty() // gradoSeccionId ahora es obligatorio
    gradoSeccionId: number;
}