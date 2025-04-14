// src/tareas/tareas.controller.ts
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
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import { TareasService } from './tarea.service';

@Controller('tareas')
@UseGuards(AuthGuard())
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post()
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR pueden crear
  create(@Body() createTareaDto: CreateTareaDto, @GetUser() user: User) {
    return this.tareasService.create(createTareaDto, user); // Se pasa el usuario
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.tareasService.findAll(user); // Se pasa el usuario
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.tareasService.findOne(id, user); //  ¡ID y usuario!
  }

  @Put(':id')
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR pueden actualizar
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTareaDto: UpdateTareaDto,
    @GetUser() user: User
  ) {
    return this.tareasService.update(id, updateTareaDto, user);
  }

  @Delete(':id')
  @Auth(validRoles.admin) // Solo ADMIN puede eliminar
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user:User) {
    return this.tareasService.remove(id, user); //Se pasa el user.
  }

  // Agregar este nuevo endpoint al TareasController existente

@Post(':id/asignar-a-todos')
@Auth(validRoles.admin, validRoles.profesor)
async asignarTareaATodos(
  @Param('id', ParseIntPipe) tareaId: number,
  @GetUser() user: User
) {
  return this.tareasService.asignarTareaATodos(tareaId, user);
}
}