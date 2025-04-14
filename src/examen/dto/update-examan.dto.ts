import { PartialType } from '@nestjs/mapped-types';
import { CreateExamenDto } from './create-examan.dto';
import { IsDate, IsOptional } from 'class-validator'; //  ¡Importante!
import { Type } from 'class-transformer';  
export class UpdateExamanDto extends PartialType(CreateExamenDto) {
   
}
