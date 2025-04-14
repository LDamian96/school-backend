// src/trimestres/trimestres.service.ts
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma.service'; //  Ajusta la ruta si es necesario
import { CreateTrimestreDto } from './dto/create-trimestre.dto';
import { UpdateTrimestreDto } from './dto/update-trimestre.dto';
import { Trimestre, User } from '@prisma/client';

@Injectable()
export class TrimestresService {
  constructor(private prisma: PrismaService) {}

  async create(createTrimestreDto: CreateTrimestreDto, user: User): Promise<Trimestre> {
    // Solo ADMIN y PROFESOR pueden crear trimestres
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para crear un trimestre.');
    }

    const { trimestre, gradoSeccionId } = createTrimestreDto;

    //Validar si existe el gradoSeccionId, si es que existe.
    if(gradoSeccionId){
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
            where: {id: gradoSeccionId}
        })
        if(!gradoSeccion) throw new BadRequestException('El GradoSeccion no existe.')
    }

    return this.prisma.trimestre.create({
      data: {
        trimestre,
        gradoSeccionId,
      
      },
      include: {  // Incluir las relaciones en la respuesta
        gradoSeccion: true,
        examen: true,
        habilidad:true,
        tarea: true,
        asistencia: true

      }
    });
  }

  async findAll(user: User): Promise<Trimestre[]> {
    // ADMIN, PROFESOR y ESTUDIANTE pueden ver todos los trimestres
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR') && !user.roles.includes('ESTUDIANTE')) {
      throw new UnauthorizedException('No tienes permiso para ver los trimestres.');
    }

      return this.prisma.trimestre.findMany({
        include: {  // Incluir las relaciones en la respuesta
          gradoSeccion: true,
            examen: true,
            habilidad:true,
            tarea: true,
            asistencia: true
        }
      });
  }

  async findOne(id: number, user: User): Promise<Trimestre> {
        // ADMIN, PROFESOR y ESTUDIANTE pueden ver  trimestres
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR') && !user.roles.includes('ESTUDIANTE')) {
      throw new UnauthorizedException('No tienes permiso para ver los trimestres.');
    }
    const trimestre = await this.prisma.trimestre.findUnique({
      where: { id },
        include: {  // Incluir las relaciones en la respuesta
          gradoSeccion: true,
          examen: true,
            habilidad:true,
            tarea: true,
            asistencia: true
        }
    });

    if (!trimestre) {
      throw new NotFoundException(`Trimestre con ID ${id} no encontrado`);
    }
    return trimestre;
  }

  async update(id: number, updateTrimestreDto: UpdateTrimestreDto, user: User): Promise<Trimestre> {
    // Solo ADMIN y PROFESOR pueden actualizar trimestres
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para actualizar un trimestre.');
    }

     //Verificamos si existe.
    const trimestreExistente = await this.prisma.trimestre.findUnique({ where: { id } });
    if (!trimestreExistente) {
      throw new NotFoundException(`Trimestre con ID ${id} no encontrado`);
    }

    const { trimestre, gradoSeccionId } = updateTrimestreDto;

    //Si actualiza el gradoSeccion, validar que exista.
    if (gradoSeccionId !== undefined && gradoSeccionId !== trimestreExistente.gradoSeccionId) {
      if(gradoSeccionId === null){ //Si se pasa null, se elimina la relacion.
        await this.prisma.trimestre.update({
          where:{id},
          data: {
            gradoSeccion:{
              disconnect: true
            }
          }
        })
      } else {
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({where: {id: gradoSeccionId}})
        if(!gradoSeccion) throw new BadRequestException('GradoSeccion no existe.')
      }
    }


    return this.prisma.trimestre.update({
      where: { id },
      data: {
        trimestre,
        gradoSeccionId,
        
      },
      include: {  // Incluir las relaciones en la respuesta
          gradoSeccion: true,
          examen: true,
            habilidad:true,
            tarea: true,
            asistencia: true

        }
    });
  }

  async remove(id: number, user: User): Promise<Trimestre> {
    // Solo ADMIN puede eliminar trimestres
    if (!user.roles.includes('ADMIN')) {
      throw new UnauthorizedException('No tienes permiso para eliminar un trimestre.');
    }
    //Verificar que exista el trimestre que se quiere eliminar
    const trimestre = await this.prisma.trimestre.findUnique({ where: { id } });
    if (!trimestre) {
      throw new NotFoundException(`Trimestre con ID ${id} no encontrado`);
    }

    return this.prisma.trimestre.delete({ where: { id } });
  }
}