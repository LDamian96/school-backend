// src/system-schools/system-schools.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator'; //  ¡Importante!
import { User } from '@prisma/client';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { validRoles } from 'src/auth/interface/valid-roles';
import {  GradoService } from './grado.service';
import { CreateGradoSeccionDto } from './dto/create-grado.dto';
import { UpdateGradoDto } from './dto/update-grado.dto';

@Controller('')
@UseGuards(AuthGuard()) //  ¡Protege todo el controlador!
export class GradoController {
  constructor(private readonly systemSchoolsService: GradoService) {}

 // --- GRADO SECCION ---

    @Post('grado-seccion')
    @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR!
    createGradoSeccion(@Body() createGradoSeccionDto: CreateGradoSeccionDto) {
        return this.systemSchoolsService.createGradoSeccion(createGradoSeccionDto);
    }

    @Get('grado-seccion')
    @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR!
    getAllGradosSecciones(@GetUser() user: User) { //  ¡Recibe el usuario!
        return this.systemSchoolsService.AllGrado(user); //  ¡Llama a la función correcta!
    }
    @Get('grado-seccion/:id')
    @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR!
    getGradoSeccionById(@Param('id', ParseIntPipe) id: number) {
        return this.systemSchoolsService.getGradoSeccionById(id);
    }

    @Put('grado-seccion/:id')
    @Auth(validRoles.admin, validRoles.profesor) //  ¡Solo ADMIN y PROFESOR!
    updateGradoSeccion(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateGradoSeccionDto: UpdateGradoDto,
    ) {
        return this.systemSchoolsService.updateGradoSeccion(id, updateGradoSeccionDto);
    }

    @Delete('grado-seccion/:id')
    @Auth(validRoles.admin) //  ¡Solo ADMIN!
    deleteGradoSeccion(@Param('id', ParseIntPipe) id: number) {
        return this.systemSchoolsService.deleteGradoSeccion(id);
    }
    // ... (resto de rutas) ...
}