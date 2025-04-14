import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator'; //  ¡Importante!
import { validRoles } from 'src/auth/interface/valid-roles';
import { CreateExamenDto } from './dto/create-examan.dto';
import { ExamenesService } from './examen.service';
import { UpdateExamanDto } from './dto/update-examan.dto';

@Controller('examenes') //  ¡Ruta base: /examenes!
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class ExamenesController {
  constructor(private readonly examenesService: ExamenesService) {}

  @Post()
  @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR pueden crear!
  create(@Body() createExamenDto: CreateExamenDto, @GetUser() user: User) {
    return this.examenesService.create(createExamenDto, user); //Se pasa el usuario
  }
  
@Post(':id/asignar-a-todos')
@Auth(validRoles.admin, validRoles.profesor)
async asignarExamenATodos(
  @Param('id', ParseIntPipe) examenId: number,
  @GetUser() user: User
) {
  return this.examenesService.asignarExamenATodos(examenId, user);
}

  @Get() //  ¡Obtener TODOS los exámenes (filtrado por rol en el servicio)!
  findAll(@GetUser() user: User) {
    return this.examenesService.findAll(user); //  ¡Pasa el usuario al servicio!
  }

  @Get(':id') //  Obtener un examen específico por ID
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.examenesService.findOne(id, user); //  ¡Pasa el ID y el usuario!
  }

  @Put(':id')
  @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR pueden actualizar!
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamenDto: UpdateExamanDto,
    @GetUser() user: User
  ) {
    return this.examenesService.update(id, updateExamenDto, user); //Se pasa el user.
  }

  @Delete(':id')
  @Auth(validRoles.admin) //  ¡Solo ADMIN puede eliminar!
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user:User) {
    return this.examenesService.remove(id, user); //Se pasa el user
  }
}