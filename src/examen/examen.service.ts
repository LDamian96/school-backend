// src/examenes/examenes.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; //  ¡Ajusta la ruta!

import { Examen, User } from '@prisma/client';
import { CreateExamenDto } from './dto/create-examan.dto';
import { UpdateExamanDto } from './dto/update-examan.dto';

@Injectable()
export class ExamenesService {
  constructor(private prisma: PrismaService) {}

  async create(createExamenDto: CreateExamenDto, user: User): Promise<Examen> {
    //Verificación de roles
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
        throw new UnauthorizedException('No tienes permiso para crear un examen.');
    }

    const {
      nombre,
      fecha,
      materiaId,
      gradoSeccionId,
      profesorId,
      estudianteId,
      horarioId,
      trimestreId,
      nota
    } = createExamenDto;

    // Validar existencia de materia
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
    });
    if (!materia) {
      throw new BadRequestException('La materia especificada no existe.');
    }

    // Validar existencia de gradoSeccion
    const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
      where: { id: gradoSeccionId },
    });
    if (!gradoSeccion) {
      throw new BadRequestException('El GradoSeccion especificado no existe.');
    }

     // Validar existencia de trimestre
     const trimestre = await this.prisma.trimestre.findUnique({
        where: { id: trimestreId },
      });
      if (!trimestre) {
        throw new BadRequestException('El Trimestre especificado no existe.');
      }

    // Validar existencia de profesor (si se proporciona)
    if (profesorId) {
      const profesor = await this.prisma.profesor.findUnique({
        where: { id: profesorId },
      });
      if (!profesor) {
        throw new BadRequestException('El profesor especificado no existe.');
      }
    }

     // Validar existencia de estudiante (si se proporciona)
     if (estudianteId) {
        const estudiante = await this.prisma.estudiante.findUnique({
          where: { id: estudianteId },
        });
        if (!estudiante) {
          throw new BadRequestException('El estudiante especificado no existe.');
        }
      }
       // Validar existencia de horario (si se proporciona)
     if (horarioId) {
        const horario = await this.prisma.horario.findUnique({
          where: { id: horarioId },
        });
        if (!horario) {
          throw new BadRequestException('El horario especificado no existe.');
        }
      }

    // Crear el examen
    return await this.prisma.examen.create({
      data: {
        nombre,
        fecha: new Date(fecha),
        nota,
        materiaId,
        gradoSeccionId,
        profesorId,
        estudianteId,
        horarioId,
        trimestreId
      },
      include: {  // Incluir las relaciones en la respuesta
        materia: true,
        gradoSeccion: true,
        profesores: true,
        estudiante: true,
        horario: true,
        Trimestre: true
      }
    });
  }

   async findAll(user: User): Promise<Examen[]> {
    if (user.roles.includes('ADMIN')) {
      return this.prisma.examen.findMany({
        include: {  // Incluir todas las relaciones relevantes
          materia: true,
          gradoSeccion: true,
          profesores: true,
          estudiante: true,
          horario: true,
          Trimestre: true,
        },
      });
    } else if (user.roles.includes('PROFESOR')) {
        // Buscar el profesor por su userId
        const profesor = await this.prisma.profesor.findUnique({
            where: { userId: user.id },
            select: { id: true } // Solo necesitamos el ID del profesor
        });

        if (!profesor) {
            throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
        }
          //Si es profesor, buscar examanes por el id del profesor.
        return this.prisma.examen.findMany({
            where: { profesorId: profesor.id },
            include: {
                materia: true,
                gradoSeccion: true,
                profesores: true,
                estudiante: true,
                horario: true,
                Trimestre: true,
              },
        })

    } else if(user.roles.includes('ESTUDIANTE')){ //Si es un estudiante.
        // Buscar el estudiante por su userId
        const estudiante = await this.prisma.estudiante.findUnique({
            where: { userId: user.id },
            select: { id: true } // Solo necesitamos el ID del estudiante
        });

        if (!estudiante) {
        throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
        }
        //Se filtra por el id del estudiante.
        return this.prisma.examen.findMany({
            where:{estudianteId: estudiante.id},
            include: {  // Incluir todas las relaciones relevantes
                materia: true,
                gradoSeccion: true,
                profesores: true,
                estudiante: true,
                horario: true,
                Trimestre: true,
              },
        })
    } else {
        throw new UnauthorizedException('No tienes permiso para ver examenes')
    }
  }

  async findOne(id: number, user: User): Promise<Examen> {
    const examen = await this.prisma.examen.findUnique({
      where: { id },
      include: {  // Incluir todas las relaciones relevantes
        materia: true,
        gradoSeccion: true,
        profesores: true,
        estudiante: true,
        horario: true,
        Trimestre: true
      },
    });

    if (!examen) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }

    // Lógica de autorización:
    if (user.roles.includes('ADMIN')) {
      return examen; // Admin puede ver cualquier examen.
    }

    if (user.roles.includes('PROFESOR')) {
        // Verificar si el examen pertenece al profesor
        if (examen.profesorId && user.id === examen.profesores?.userId) {
            return examen;
        }
    }

    if (user.roles.includes('ESTUDIANTE')) {
       // Verificar si el examen pertenece al estudiante
        if (examen.estudianteId && user.id === examen.estudiante?.userId) {
            return examen;
        }
    }

    // Si no es admin, ni profesor del examen, ni estudiante del examen:
    throw new UnauthorizedException('No tienes permiso para ver este examen');
  }

  async update(id: number, updateExamenDto: UpdateExamanDto, user: User): Promise<Examen> {
    //Verificar roles
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
        throw new UnauthorizedException('No tienes permiso para actualizar un examen.');
    }
    //Verificar si existe el examen.
    const examen = await this.prisma.examen.findUnique({where:{id}, include:{profesores: {include: {user:true}}}});
    if(!examen) throw new NotFoundException('Examen no encontrado')

    //Si es profesor, verificar que pueda editar este examen
    if(user.roles.includes('PROFESOR') && examen.profesores?.userId !== user.id)
        throw new UnauthorizedException('No tienes permisos para editar este examen.')

    const { nombre, fecha, materiaId, gradoSeccionId, profesorId, estudianteId, horarioId, trimestreId, nota } = updateExamenDto;

    //Si se actualiza el id de la materia, verificar que exista.
    if (materiaId && materiaId !== examen.materiaId) {
        const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
        if (!materia) throw new BadRequestException('Materia inválida');
    }

    //Si se actualiza el id del gradoSeccion, verificar que exista.
    if (gradoSeccionId && gradoSeccionId !== examen.gradoSeccionId) {
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
        if (!gradoSeccion) throw new BadRequestException('GradoSeccion inválido');
    }

    //Si se actualiza el id del profesor, verificar que exista.
    if (profesorId !== undefined && profesorId !== examen.profesorId) {
        if(profesorId === null){ //Si se pasa null, se elimina la relación.
            await this.prisma.examen.update({
                where:{id},
                data:{
                    profesores:{
                        disconnect: true //Desconectar el profesor
                    }
                }
            })
        } else {
            const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
        if (!profesor) throw new BadRequestException('Profesor inválido');
        }

    }

    //Si se actualiza el id del estudiante, verificar que exista.
    if (estudianteId !== undefined && estudianteId !== examen.estudianteId) {
        if(estudianteId === null){ //Si se pasa null, se elimina la relación.
            await this.prisma.examen.update({
                where:{id},
                data:{
                    estudiante:{
                        disconnect: true //Desconectar el estudiante.
                    }
                }
            })
        }
        const estudiante = await this.prisma.estudiante.findUnique({ where: { id: estudianteId } });
        if (!estudiante) throw new BadRequestException('Estudiante inválido');
    }

    //Si se actualiza el id del horario, verificar que exista.
    if (horarioId !== undefined && horarioId !== examen.horarioId) {
        if(horarioId === null){ //Si se pasa null, se elimina la relación.
            await this.prisma.examen.update({
                where:{id},
                data:{
                    horario:{
                        disconnect: true //Desconectar el horario.
                    }
                }
            })
        }
        const horario = await this.prisma.horario.findUnique({ where: { id: horarioId } });
        if (!horario) throw new BadRequestException('Horario inválido');
    }
    //Si se actualiza el id del trimestre, verificar que exista.
     if (trimestreId && trimestreId !== examen.trimestreId) {
        const trimestre = await this.prisma.trimestre.findUnique({ where: { id: trimestreId } });
        if (!trimestre) throw new BadRequestException('Trimestre inválido');
    }

    // Actualizar el examen, si pasa todas las validaciones.
    return await this.prisma.examen.update({
        where: { id },
        data: {
            nombre,
            fecha: fecha? new Date(fecha) : undefined,
            nota,
            materiaId,
            gradoSeccionId,
            profesorId,
            estudianteId,
            horarioId,
            trimestreId
        },
        include: {  // Incluir todas las relaciones
            materia: true,
            gradoSeccion: true,
            profesores: true,
            estudiante: true,
            horario: true,
            Trimestre: true
        }
    });
}


  async remove(id: number, user:User): Promise<Examen> {
    //Verificar roles
    if(!user.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos para realizar esta acción.')
    //Verificar si el examen existe.
    const examen = await this.prisma.examen.findUnique({ where: { id } });
    if (!examen) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }
    return await this.prisma.examen.delete({ where: { id } });
  }
  // En tu ExamenesService
async asignarExamenATodos(examenId: number, user: User) {
  // Verificar permisos
  if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
    throw new UnauthorizedException('No tienes permiso para asignar exámenes');
  }
  
  // Obtener el examen original
  const examenOriginal = await this.prisma.examen.findUnique({
    where: { id: examenId },
    include: { gradoSeccion: { include: { estudiantes: true } } }
  });
  
  if (!examenOriginal) {
    throw new NotFoundException('Examen no encontrado');
  }
  
  // Verificar que el examen esté asociado a un gradoSeccion
  if (!examenOriginal.gradoSeccionId) {
    throw new BadRequestException('El examen no está asociado a un grado/sección');
  }
  
  // Si es profesor, verificar que tenga permiso para este examen
  if (user.roles.includes('PROFESOR')) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { userId: user.id }
    });
    
    if (!profesor || examenOriginal.profesorId !== profesor.id) {
      throw new UnauthorizedException('No tienes permiso para asignar este examen');
    }
  }
  
  // Crear copias del examen para cada estudiante
  const copias = [];
  for (const estudiante of examenOriginal.gradoSeccion.estudiantes) {
    if (estudiante.isActive) {
      const copia = await this.prisma.examen.create({
        data: {
          nombre: examenOriginal.nombre,
          fecha: examenOriginal.fecha,
          materiaId: examenOriginal.materiaId,
          gradoSeccionId: examenOriginal.gradoSeccionId,
          profesorId: examenOriginal.profesorId,
          estudianteId: estudiante.id,
          horarioId: examenOriginal.horarioId,
          trimestreId: examenOriginal.trimestreId
        }
      });
      copias.push(copia);
    }
  }
  
  return { message: `Examen asignado a ${copias.length} estudiantes`, copias };
}
}