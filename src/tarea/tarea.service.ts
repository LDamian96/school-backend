import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; // ¡Ajusta la ruta!
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { Tarea, User } from '@prisma/client'; // ¡Importante!
import { Prisma } from '@prisma/client';

@Injectable()
export class TareasService {
  constructor(private prisma: PrismaService) {}
  // Agregar este método al TareasService existente

async asignarTareaATodos(tareaId: number, user: User) {
  // Verificar permisos
  if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
    throw new UnauthorizedException('No tienes permiso para asignar tareas');
  }
  
  // Obtener la tarea original
  const tareaOriginal = await this.prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { gradoSeccion: { include: { estudiantes: true } } }
  });
  
  if (!tareaOriginal) {
    throw new NotFoundException('Tarea no encontrada');
  }
  
  // Verificar que la tarea esté asociada a un gradoSeccion
  if (!tareaOriginal.gradoSeccionId) {
    throw new BadRequestException('La tarea no está asociada a un grado/sección');
  }
  
  // Si es profesor, verificar que tenga permiso para esta tarea
  if (user.roles.includes('PROFESOR')) {
    const profesor = await this.prisma.profesor.findUnique({
      where: { userId: user.id }
    });
    
    if (!profesor || tareaOriginal.profesorId !== profesor.id) {
      throw new UnauthorizedException('No tienes permiso para asignar esta tarea');
    }
  }
  
  // Crear copias de la tarea para cada estudiante
  const copias = [];
  for (const estudiante of tareaOriginal.gradoSeccion.estudiantes) {
    if (estudiante.isActive) {
      const copia = await this.prisma.tarea.create({
        data: {
          descripcion: tareaOriginal.descripcion,
          fechaEntrega: tareaOriginal.fechaEntrega,
          materiaId: tareaOriginal.materiaId,
          gradoSeccionId: tareaOriginal.gradoSeccionId,
          profesorId: tareaOriginal.profesorId,
          estudianteId: estudiante.id,
          trimestreId: tareaOriginal.trimestreId,
          entrego: false,
          calificacion: null
        }
      });
      copias.push(copia);
    }
  }
  
  return { message: `Tarea asignada a ${copias.length} estudiantes`, copias };
}

  async create(createTareaDto: CreateTareaDto, user: User): Promise<Tarea> {
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para crear una tarea.');
    }
    const {
      descripcion,
      fechaEntrega,
      calificacion,
      materiaId,
      gradoSeccionId,
      profesorId,
      estudianteId,
      trimestreId,
      entrego
    } = createTareaDto;

    // Validar existencia de materia, gradoSeccion, y trimestre
    const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
    if (!materia) throw new BadRequestException('La materia especificada no existe.');
    const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
    if (!gradoSeccion) throw new BadRequestException('El GradoSeccion especificado no existe.');
    const trimestre = await this.prisma.trimestre.findUnique({ where: { id: trimestreId } });
    if (!trimestre) throw new BadRequestException('El Trimestre especificado no existe.');

    // Validar existencia de profesor (si se proporciona)
    if (profesorId) {
      const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
      if (!profesor) throw new BadRequestException('El profesor especificado no existe.');
    }
      // Validar existencia de estudiante (si se proporciona)
    if (estudianteId) {
        const estudiante = await this.prisma.estudiante.findUnique({ where: { id: estudianteId } });
        if (!estudiante) throw new BadRequestException('El estudiante especificado no existe.');
    }


    // Crear la tarea
    return this.prisma.tarea.create({
      data: {
        descripcion,
        fechaEntrega,
        calificacion,
        materiaId,
        gradoSeccionId,
        profesorId,  // Puede ser null
        estudianteId, // Puede ser null
        trimestreId,
        entrego,
      },
      include: { //Se incluyen todas las relaciones
        materia: true,
        gradoSeccion: true,
        profesores: {include: {user: true}}, //Para mostrar la información del usuario.
        estudiante: {include: {user:true}}, //Se incluye la relación con estudiante
        Trimestre: true,
      }
    });
  }

    async findAll(user: User): Promise<Tarea[]> {
        if (user.roles.includes('ADMIN')) {
        return this.prisma.tarea.findMany({
            include: {  // Incluir todas las relaciones relevantes
            materia: true,
            gradoSeccion: true,
            profesores: {include: {user:true}}, //Incluir la relación con el usuario.
            estudiante: {include: {user: true}}, //Se incluye la relación con estudiante.
            Trimestre: true,
            },
        });
        } else if (user.roles.includes('PROFESOR')) {
            const profesor = await this.prisma.profesor.findUnique({
                where:{userId: user.id},
                select: {id: true} //Solo se necesita el id
            })

            if(!profesor) throw new UnauthorizedException('No tienes permisos')

            return this.prisma.tarea.findMany({
                where: { profesorId: profesor.id }, //Se filtran solo las tareas del profesor.
                include: {  //  Incluir las relaciones
                materia: true,
                gradoSeccion: true,
                profesores: {include: {user: true}},
                estudiante: {include: {user: true}},//Se incluye la relación con estudiante.
                Trimestre: true,
                },
            });
        } else if(user.roles.includes('ESTUDIANTE')){
            const estudiante = await this.prisma.estudiante.findUnique({
                where: { userId: user.id },
                select:{
                    id: true,
                    gradoSeccionId: true
                }
            });

            if (!estudiante) {
            throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
            }
            //Se buscan las tareas donde el estudiante este asignado, o todas las tareas del grado y seccion
            return this.prisma.tarea.findMany({
                where:{
                    OR:[
                        {estudianteId: estudiante.id}, //Tareas individuales.
                        {gradoSeccionId: estudiante.gradoSeccionId} //Tareas del grado y sección.
                    ]
                },
                include: {  //  Incluir las relaciones
                    materia: true,
                    gradoSeccion: true,
                    profesores: {include: {user: true}},
                    estudiante: {include: {user: true}},//Se incluye la relación con estudiante.
                    Trimestre: true,
                },
            })
        } else {
            throw new UnauthorizedException('No tienes permiso para ver tareas')
        }
    }

    async findOne(id: number, user: User): Promise<Tarea> {
    //  ¡Primero* obtenemos la tarea, *luego* verificamos permisos.
    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      include: { //  ¡Incluir las relaciones *aquí*, en la consulta principal!
        materia: true,
        gradoSeccion: true,
        profesores: { include: { user: true } }, //  ¡Incluye user dentro de profesores!
        estudiante: { include: { user: true } },  //  ¡Incluye user dentro de estudiante!
        Trimestre: true
      },
    });

    if (!tarea) {
      throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    }

    // Lógica de autorización:
    if (user.roles.includes('ADMIN')) {
      return tarea; // Admin puede ver cualquier tarea.
    }

    if (user.roles.includes('PROFESOR')) {
      // Profesor: Solo si la tarea le pertenece (verifica el userId del profesor)
      if (tarea.profesorId && tarea.profesores && user.id === tarea.profesores.user.id) {
        return tarea;
      }
    }

    if (user.roles.includes('ESTUDIANTE')) {
      // Estudiante:  Solo si la tarea está asignada a él o a su grado/sección.
      if (tarea.estudianteId && tarea.estudiante && user.id === tarea.estudiante.user.id) {
          return tarea;
      }
        //Verificar si la tarea pertenece al grado/sección del estudiante
        const estudiante = await this.prisma.estudiante.findUnique({
            where: { userId: user.id },
            select: { gradoSeccionId: true } // Solo necesitamos el gradoSeccionId
        });

        if (estudiante && tarea.gradoSeccionId === estudiante.gradoSeccionId) {
            return tarea;
        }
    }

    // Si no es admin, ni el profesor asignado, ni el estudiante asignado, ni del grado/sección:
    throw new UnauthorizedException('No tienes permiso para ver esta tarea');
  }

  async update(id: number, updateTareaDto: UpdateTareaDto, user: User): Promise<Tarea> {
    // Verificar roles
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
        throw new UnauthorizedException('No tienes permiso para actualizar una tarea.');
    }

    // Obtener la tarea existente (con relaciones para autorización)
    const tarea = await this.prisma.tarea.findUnique({
        where: { id },
        include: {
            profesores: { include: { user: true } }, // Para la verificación de permisos del profesor
            estudiante: { include: {user: true}},
            materia: true, // Necesario
            gradoSeccion: true, //Necesario
            Trimestre: true //Necesario

        },
    });

    if (!tarea) {
        throw new NotFoundException('Tarea no encontrada');
    }

    // Verificar permisos del profesor
    if (user.roles.includes('PROFESOR') && tarea.profesorId && tarea.profesores?.user.id !== user.id) {
        throw new UnauthorizedException('No tienes permiso para actualizar esta tarea.');
    }

    const {
        descripcion,
        fechaEntrega,
        calificacion,
        materiaId,
        gradoSeccionId,
        profesorId,
        estudianteId,
        trimestreId,
        entrego,
    } = updateTareaDto;

    // --- Validaciones y Actualizaciones de Relaciones (una por una) ---

    // Materia
    if (materiaId !== undefined && materiaId !== tarea.materiaId) {
        const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
        if (!materia) throw new BadRequestException('Materia inválida');
    }

    // GradoSeccion
    if (gradoSeccionId !== undefined && gradoSeccionId !== tarea.gradoSeccionId) {
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
        if (!gradoSeccion) throw new BadRequestException('GradoSeccion inválido');
    }

    // Profesor
    if (profesorId !== undefined) { //  ¡IMPORTANTE: !== undefined!
        if (profesorId === null) {
            // Desconectar profesor
            await this.prisma.tarea.update({
                where: { id },
                data: { profesores: { disconnect: true } },
            });
        } else {
            // Verificar que el profesor exista y CONECTARLO
            const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
            if (!profesor) {
              throw new BadRequestException('Profesor inválido');
            }
        }
    }

    // Estudiante
    if (estudianteId !== undefined) {
        if (estudianteId === null) {
             await this.prisma.tarea.update({
                where:{id},
                data:{
                    estudiante:{
                        disconnect: true //Desconectar el estudiante.
                    }
                }
            })
        } else {
          const estudiante = await this.prisma.estudiante.findUnique({
            where: { id: estudianteId },
          });
          if (!estudiante) throw new BadRequestException('Estudiante inválido');
        }
      }

    // Trimestre
    if (trimestreId !== undefined && trimestreId !== tarea.trimestreId) {
        const trimestre = await this.prisma.trimestre.findUnique({ where: { id: trimestreId } });
        if (!trimestre) throw new BadRequestException('Trimestre inválido');
    }

    // --- Actualización Final (con los campos restantes) ---
    // Ahora sí, se actualiza la tarea con los cambios de los campos básicos.
    return await this.prisma.tarea.update({
        where: { id },
        data: {
            descripcion,          // undefined no se actualiza
            fechaEntrega,       // undefined no se actualiza
            calificacion,       // undefined no se actualiza
            materiaId,      // Ya validado
            gradoSeccionId, // Ya validado
            profesorId,     // Ya validado (puede ser null o un ID)
            estudianteId,   // Ya validado (puede ser null o un ID)
            trimestreId,    // Ya validado
            entrego,            // undefined no se actualiza

        },
        include: { //Se incluyen todas las relaciones.
            materia: true,
            gradoSeccion: true,
            profesores: { include: { user: true } },
            estudiante: {include: {user: true}}, //Se incluye la relación con estudiante
            Trimestre: true,
        },
    });
}

    async remove(id: number, user:User): Promise<Tarea> {
    //Verificar roles
    if(!user.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos para realizar esta acción.')
    //Verificar si la tarea existe.
    const examen = await this.prisma.tarea.findUnique({ where: { id } });
    if (!examen) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }
    return await this.prisma.tarea.delete({ where: { id } });
  }
}