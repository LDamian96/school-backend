// src/profesores/profesores.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Req,
  UnauthorizedException,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateProfesorDto } from './dto/create-profesor.dto';
import { UpdateProfesorDto } from './dto/update-profesor.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import { ProfesoresService } from './profesor.service';
import { Request } from 'express'; // Import Request

@Controller('profesores')
@UseGuards(AuthGuard())
export class ProfesoresController {
  constructor(private readonly profesoresService: ProfesoresService) {}

  @Post()
  @Auth(validRoles.admin)
  create(@Body() createProfesorDto: CreateProfesorDto, @GetUser() user: User) {
    return this.profesoresService.create(createProfesorDto, user);
  }

  @Get()
  @Auth(validRoles.admin)
  findAll(@GetUser() user: User) {
    return this.profesoresService.findAll(user);
  }

  @Get(':id')
  findOne(@GetUser() user:User, @Param('id') userId: string) {
    return this.profesoresService.findOne(userId, user);
  }

  @Put(':id')
  @Auth(validRoles.admin)
  update(
    @Param('id') userId: string,
    @Body() updateProfesorDto: UpdateProfesorDto,
    @GetUser() user: User,
  ) {
    return this.profesoresService.update(userId, updateProfesorDto, user);
  }

  @Patch(':id/status')//Se cambia la ruta para el soft delete
  @Auth(validRoles.admin)
  remove(@Param('id') userId: string, @GetUser() user:User) {
    return this.profesoresService.remove(userId, user);
  }
  @Get(':id/materias')
  async getMaterias(@GetUser() user: User, @Param('id') userId: string) {
      //Verificación de roles, y que sea el mismo usuario.
      if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === userId)) {
          throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.profesoresService.getMaterias(userId); //  ¡Pasa el userId!
  }

  //  Obtiene los grados/secciones a los que está *asociado* el profesor.
  @Get(':id/grados-secciones')
  async getGradosSecciones(@GetUser() user: User, @Param('id') userId: string) {
    //Verificación de roles, y que sea el mismo usuario.
      if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === userId)) {
        throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.profesoresService.getGradosSecciones(userId); //  ¡Pasa el userId!
  }

   // Obtiene los horarios de un profesor.
  @Get(':id/horarios')
  @Auth(validRoles.profesor)
  async getHorarios(@GetUser() user: User, @Param('id') userId: string) {
      //Verificación de roles, y que sea el mismo usuario.
      if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === userId)) {
        throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.profesoresService.getHorarios(userId); //  ¡Pasa el userId!
  }

  @Get('tarea/:userId/grado-seccion/:gradoSeccionId')
  @Auth(validRoles.admin, validRoles.profesor)  //  ¡Solo ADMIN y PROFESOR!
  async findTareasByProfesorAndGradoSeccion(
    @GetUser() user: User,
    @Param('userId') profesorUserId: string, //Se espera un string
    @Param('gradoSeccionId', ParseIntPipe) gradoSeccionId: number, //Se espera un entero
  ) {
       if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === profesorUserId)) {
              throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
          }
    return this.profesoresService.findTareasByProfesorAndGradoSeccion(
      profesorUserId,
      gradoSeccionId,
      user
    );
  }
    


    @Get('examen/:userId/grado-seccion/:gradoSeccionId')
    @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR!
    async findExamenesByProfesorAndGradoSeccion(
        @GetUser() user: User, //Se obtiene el usuario.
        @Param('userId') userId: string, //Se espera el id del usuario.
        @Param('gradoSeccionId', ParseIntPipe) gradoSeccionId: number, //Se espera un entero
    ) {
        //Verificar roles, y que sea el mismo usuario.
        if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === userId)) {
            throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
        }
        return this.profesoresService.findExamenesByProfesorAndGradoSeccion(
        userId,
        gradoSeccionId,
        user
        );
    }

    @Get(':id/asistencias')
    @Auth(validRoles.admin, validRoles.profesor) //Se actualiza
    async getAsistencias(
      @GetUser() user: User,
      @Param('id') userId: string, //  ¡Recibe el userId del profesor!
    ) {
      if (!user.roles.includes('ADMIN') && !(user.roles.includes('PROFESOR') && user.id === userId)) {
          throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.profesoresService.getAsistencias(userId, user); //  ¡Pasa el userId!
    }

}
