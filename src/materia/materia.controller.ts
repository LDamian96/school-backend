import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import { MateriasService } from './materia.service';

@Controller('materias') //  ¡Ruta base: /materias!
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class MateriasController {
  constructor(private readonly materiasService: MateriasService) {}

  @Post()
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN puede crear
  create(@Body() createMateriaDto: CreateMateriaDto) {
    return this.materiasService.createMateria(createMateriaDto);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.materiasService.getMaterias(user); //  ¡Pasa el usuario!
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.materiasService.getMateriaById(id, user); //  ¡Pasa el ID y el usuario!
  }

  @Put(':id')
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN puede actualizar
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMateriaDto: UpdateMateriaDto,
  ) {
    return this.materiasService.updateMateria(id, updateMateriaDto);
  }

  @Delete(':id')
  @Auth(validRoles.admin, validRoles.profesor) // Solo ADMIN puede eliminar
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materiasService.deleteMateria(id);
  }

   
}