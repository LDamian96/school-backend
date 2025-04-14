import { PartialType } from '@nestjs/mapped-types';
import {  CreateGradoSeccionDto } from './create-grado.dto';

export class UpdateGradoDto extends PartialType(CreateGradoSeccionDto) {}
