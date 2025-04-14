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
  UnauthorizedException
} from '@nestjs/common';
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';

import { EstudiantesService } from './estudiante.service';
@Controller('estudiantes') //  ¡Ruta base: /estudiantes!
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class EstudiantesController {
  constructor(private readonly estudiantesService: EstudiantesService) {}

  @Post()
  @Auth(validRoles.admin) //  ¡Solo ADMIN puede crear!
  create(@Body() createEstudianteDto: CreateEstudianteDto, @GetUser() user: User) {
    return this.estudiantesService.create(createEstudianteDto, user); //Se para el user.
  }

  @Get()
  @Auth(validRoles.admin) // ¡Solo ADMIN puede obtener todos!
  findAll(@GetUser() user:User) {
    return this.estudiantesService.findAll(user); //Se pasa el user
  }

    @Get(':id')  //  Obtener un estudiante por su userId (string UUID)
    findOne(@GetUser() user: User, @Param('id') userId: string) {
        return this.estudiantesService.findOne(userId, user); //Se pasa el user, y el id del usuario
    }

  @Put(':id')
  @Auth(validRoles.admin) //  ¡Solo ADMIN puede actualizar!
  update(
    @Param('id') userId: string,  //  ¡Recibe el userId, string!
    @Body() updateEstudianteDto: UpdateEstudianteDto,
    @GetUser() user:User
  ) {
    return this.estudiantesService.update(userId, updateEstudianteDto, user); //Se pasa el user.
  }

  @Patch(':id/status') //  ¡Usa el userId, string!
  @Auth(validRoles.admin)
  remove(@Param('id') userId: string, @GetUser() user:User) { //Se pasa el usuario.
    return this.estudiantesService.remove(userId, user);
  }

  //get econsultas
  @Get(':id/materias')  //  ¡Usa :id en la URL!
  @Auth(validRoles.estudiante, validRoles.admin) 
  async getMaterias(@GetUser() user: User, @Param('id') userId: string) { //Recibe el user y el id.
      //Verificar roles.
      if (!user.roles.includes('ADMIN') && user.id !== userId) {
          throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.estudiantesService.getMaterias(userId, user); //Se actualizó el service
  }

 
  @Get(':id/grado-seccion')  //  ¡Usa :id en la URL!
  @Auth(validRoles.estudiante,validRoles.admin) 

  async getGradoSeccion(@GetUser() user: User, @Param('id') userId: string) { //Recibe el user y el id.
     //Verificar roles.
      if (!user.roles.includes('ADMIN') && user.id !== userId) {
          throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
      }
      return this.estudiantesService.getGradoSeccion(userId, user); //Se actualizó el service
  }

  @Get(':id/horarios')//  ¡Usa :id en la URL!
  @Auth(validRoles.estudiante,validRoles.admin) 

  async getHorarios(@GetUser() user: User, @Param('id') userId: string) { //Recibe el user y el id
      //Verificar Roles
      if(!user.roles.includes('ADMIN') && user.id !== userId)
          throw new UnauthorizedException('No tienes permisos para ver esta información.')

      return this.estudiantesService.getHorarios(userId, user); //  ¡Pasa el userId y el user!
  }
  @Get(':id/asistencias') // Ruta para obtener asistencias de un estudiante
  @Auth(validRoles.estudiante,validRoles.admin) 

  async getAsistencias(
    @GetUser() user: User,
    @Param('id') userId: string, // El ID del *usuario* del estudiante (no el ID del estudiante)
  ) {
    if (!user.roles.includes('ADMIN') && !(user.roles.includes('ESTUDIANTE') && user.id === userId)) {
        throw new UnauthorizedException('No tienes permiso para acceder a este recurso.');
    }
    return this.estudiantesService.getAsistencias(userId, user); // Llama a la función del servicio
  }
}