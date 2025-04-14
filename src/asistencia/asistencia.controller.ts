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
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import { AsistenciasService } from './asistencia.service';


@Controller('asistencias') //  ¡Ruta base: /asistencias!
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class AsistenciasController {
  constructor(private readonly asistenciasService: AsistenciasService) {}

  @Post()
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR pueden crear
  create(@Body() createAsistenciaDto: CreateAsistenciaDto, @GetUser() user:User) {
    return this.asistenciasService.create(createAsistenciaDto, user); //Se pasa el user
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.asistenciasService.findAll(user); //Se pasa el user
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.asistenciasService.findOne(id, user); //  ¡ID y usuario!
  }

  @Put(':id')
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN y PROFESOR pueden actualizar
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsistenciaDto: UpdateAsistenciaDto,
    @GetUser() user: User
  ) {
    return this.asistenciasService.update(id, updateAsistenciaDto, user); //Se pasa el user
  }

  @Delete(':id')
  @Auth(validRoles.admin) // Solo ADMIN puede eliminar
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.asistenciasService.remove(id, user); //Se pasa el user.
  }
}