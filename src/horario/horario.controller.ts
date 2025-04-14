// src/horarios/horarios.controller.ts
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
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import { HorariosService } from './horario.service';

@Controller('horarios') //  ¡Ruta base: /horarios!
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Post()
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR
  create(@Body() createHorarioDto: CreateHorarioDto, @GetUser() user: User) {
    return this.horariosService.create(createHorarioDto, user); //Se pasa el user
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.horariosService.findAll(user); //Se pasa el user
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.horariosService.findOne(id, user); //Se pasa el user
  }

  @Put(':id')
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHorarioDto: UpdateHorarioDto,
    @GetUser() user: User
  ) {
    return this.horariosService.update(id, updateHorarioDto, user); //Se pasa el user
  }

  @Delete(':id')
  @Auth(validRoles.admin) // Solo ADMIN
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.horariosService.remove(id, user); //Se pasa el user
  }
}