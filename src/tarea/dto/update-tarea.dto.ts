import { PartialType } from '@nestjs/mapped-types';
import { CreateTareaDto } from './create-tarea.dto';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTareaDto extends PartialType(CreateTareaDto) {
    @IsDate()
    @Type(() => Date)
    @IsOptional() //Se valida el tipo y que sea opcional.
    fechaEntrega?: Date;
}
