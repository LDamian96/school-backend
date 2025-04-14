// src/trimestres/trimestres.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req
} from '@nestjs/common';
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { AuthGuard } from '@nestjs/passport'; //  ¡Asegúrate de tenerlo!
import { Request } from 'express';
import { User } from '@prisma/client';
import { TrimestresService } from './trimestre.service';


@Controller('trimestres')
export class TrimestresController {
  constructor(private readonly trimestresService: TrimestresService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) //  Protege la ruta, requiere autenticación
  create(@Body() createTrimestreDto: CreateTrimestreDto, @Req() req: Request) {
     const user = req.user as User; // Obtener el usuario
    return this.trimestresService.create(createTrimestreDto, user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt')) //  Protege la ruta, requiere autenticación
  findAll(@Req() req: Request) {
      const user = req.user as User; // Obtener el usuario
    return this.trimestresService.findAll(user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt')) //  Protege la ruta, requiere autenticación
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
      const user = req.user as User; // Obtener el usuario
    return this.trimestresService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) //  Protege la ruta, requiere autenticación
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrimestreDto: UpdateTrimestreDto,
    @Req() req: Request
  ) {
      const user = req.user as User; // Obtener el usuario
    return this.trimestresService.update(id, updateTrimestreDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) //  Protege la ruta, requiere autenticación
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
      const user = req.user as User;
    return this.trimestresService.remove(id, user);
  }
}