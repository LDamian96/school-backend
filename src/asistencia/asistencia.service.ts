// src/asistencias/asistencias.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; // ¡Ajusta la ruta!
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { Asistencia, User, Profesor, Tarea } from '@prisma/client'; // ¡Importante!
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';
@Injectable()
export class AsistenciasService {
  constructor(private prisma: PrismaService) {}

  async create(createAsistenciaDto: CreateAsistenciaDto, user: User): Promise<Asistencia> {
    // Verificar roles (ADMIN o PROFESOR)
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para registrar asistencia.');
    }

    const {
      estado,
      fecha,
      estudianteId,
      gradoSeccionId,
      materiaId,
      profesorId,
      trimestreId,
      asistio
    } = createAsistenciaDto;

    // Validar existencia de materia, gradoSeccion y trimestre
    if (!await this.prisma.materia.findUnique({ where: { id: materiaId } })) {
      throw new BadRequestException('La materia especificada no existe.');
    }
    if (!await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } })) {
      throw new BadRequestException('El GradoSeccion especificado no existe.');
    }

     if (!await this.prisma.trimestre.findUnique({ where: { id: trimestreId } })) {
        throw new BadRequestException('El Trimestre especificado no existe.');
    }

    // Validar existencia de profesor (si se proporciona).  Si no se proporciona, usar el ID del usuario actual.
    let profesorIdToUse = profesorId;
    if (user.roles.includes('PROFESOR') && !profesorId) {
      //Si es profesor, y no se proporciona un profesorId, se usa el id del profesor logueado.
      const profesor = await this.prisma.profesor.findUnique({
            where:{userId: user.id},
            select: {id: true}
        })
        profesorIdToUse = profesor.id;
    } else if (profesorId) {
        //Si se proporciona un profesor, verificar que exista.
        const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
        if(!profesor) throw new BadRequestException('El profesor no existe')
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
    const fechaInicio = startOfDay(new Date(fecha));
    const fechaFin = endOfDay(new Date(fecha));

     const whereClause: any = {
        fecha: {
            gte: fechaInicio,
            lte: fechaFin,
        },
        gradoSeccionId,
        materiaId
     }

    if(estudianteId){ //Si existe un estudiante, se guarda la asistencia individual
        whereClause.estudianteId = estudianteId;
    } else { //Si no se pasa un estudiante, es una asistencia grupal, por lo tanto no debe existir ninguna asistencia para
            //ningun estudiante en ese grado, sección y materia.
        whereClause.estudianteId = null; //Se agrega
    }

    const asistenciaExistente = await this.prisma.asistencia.findFirst({
      where: whereClause
    });

    if (asistenciaExistente) {
      throw new ConflictException('Ya existe un registro de asistencia para esta fecha, grado/sección y materia.');
    }

    // Crear la asistencia
    return this.prisma.asistencia.create({
      data: {
        estado,
        fecha,
        estudianteId,
        gradoSeccionId,
        materiaId,
        profesorId: profesorIdToUse, // Usar el ID del profesor (o el del usuario actual si es PROFESOR)
        trimestreId,
        },
      include: {
            estudiante: {include: {user: true}},
            gradoSeccion: true,
            materia: true,
            profesor: {include: {user: true}},
            Trimestre: true
      }
    });
  }

  
// tareas.service.ts

  // ... (create - sin cambios) ...
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
        // Obtener las materias y grados/secciones del profesor.
        const profesor = await this.prisma.profesor.findUnique({
            where: { userId: user.id },
            include: {
                materias: true,  //  ¡Importante!  Obtener las materias del profesor.
                horarios: {      // ¡Importante! y obtener los horarios
                    include:{
                        gradoSeccion: true //Para obtener los grados y secciones.
                    }
                }
            },
        });

        if (!profesor) {
            throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
        }

        // Extraer los gradoSeccionIds a los que el profesor tiene acceso
        // a partir de los horarios.
        const gradoSeccionIds = profesor.horarios.map(horario => horario.gradoSeccionId);

        // Filtrar las tareas por las materias del profesor *y* los gradoSeccionId.
        return this.prisma.tarea.findMany({
            where: {
                materiaId: {
                    in: profesor.materias.map((m) => m.id), // Tareas de las materias del profesor
                },
                gradoSeccionId: { //Que pertenezcan a los grados y secciones donde el profesor tiene horarios.
                    in: gradoSeccionIds
                }
            },
             include: {  //  Incluir las relaciones
                materia: true,
                gradoSeccion: true,
                profesores: {include: {user: true}},
                estudiante: {include: {user: true}},//Se incluye la relación con estudiante.
                Trimestre: true,
                },
        });


    } else if(user.roles.includes('ESTUDIANTE')){ //Si es un estudiante.
          //Se obtiene el estudiante, con las relaciones necesarias.
            const estudiante = await this.prisma.estudiante.findUnique({
                where: { userId: user.id },
                select:{
                    id: true,
                    gradoSeccionId: true //Seleccionar el gradoSeccionId
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
        const tarea = await this.prisma.tarea.findUnique({
            where: { id },
            include: {
                materia: true,
                gradoSeccion: true,
                profesores: { include: { user: true } },
                estudiante: { include: { user: true } },
                Trimestre: true
            }
        });
        if (!tarea) {
            throw new NotFoundException(`Tarea con id ${id} no encontrada`)
        }
        // Lógica de autorización
        if (user.roles.includes('ADMIN')) {
            return tarea;
        }
        //Si es profesor, buscar si imparte esa materia en ese grado/sección
        if (user.roles.includes('PROFESOR')) {
            const profesor = await this.prisma.profesor.findUnique({
                where: { userId: user.id },
                include: {
                    materias: true,  // Obtener las materias del profesor
                    horarios: {   // Obtener los horarios del profesor
                        where: {
                            gradoSeccionId: tarea.gradoSeccionId, // Filtrar por el GradoSeccion de la tarea
                        },
                    },
                },
            });

            //Si la tarea que se busca, pertenece a una materia que imparte el profesor, y si el profesor tiene horarios
            //en el grado y sección de la tarea, se le permite ver la tarea
            if (profesor && profesor.materias.some(m => m.id === tarea.materiaId) && profesor.horarios.length > 0) {
                return tarea;
            }
        }
        //Si es un estudiante, buscar si el estudiante está en el mismo grado/sección de la tarea, o si la tarea está asignada a él.
        if (user.roles.includes('ESTUDIANTE')) {
           if (tarea.estudianteId && user.id === tarea.estudiante?.user.id) {
                return tarea;
            }
           const estudiante = await this.prisma.estudiante.findUnique({
            where: { userId: user.id },
            select:{
                gradoSeccionId: true
            }
        });
        if(!estudiante) throw new UnauthorizedException('No tienes permisos')
        if(tarea.gradoSeccionId === estudiante.gradoSeccionId) return tarea; //verifica que la tarea sea de su grado/sección

        }
        throw new UnauthorizedException('No tienes permiso para ver esta tarea');
    }
// ...

  async update(id: number, updateAsistenciaDto: UpdateAsistenciaDto, user: User): Promise<Asistencia> {
    //Verificar roles
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
        throw new UnauthorizedException('No tienes permiso para actualizar un examen.');
    }
    //Verificar si existe el examen.
   const asistencia = await this.prisma.asistencia.findUnique({
        where:{id},
        include: {  //  ¡Importante! Incluir relaciones.
            materia: true,
            gradoSeccion: true,
            profesor: {include: {user: true}}, //Se incluye la relación.
            estudiante: {include: {user: true}}, //Se incluye la relación.
            Trimestre: true
        },
    });
    if(!asistencia) throw new NotFoundException('Asistencia no encontrada')

    //Si es profesor, verificar que pueda editar
    if(user.roles.includes('PROFESOR') && asistencia.profesor?.user.id !== user.id)
        throw new UnauthorizedException('No tienes permisos para editar esta asistencia.')

    const {
        estado,
        fecha,
        estudianteId,
        gradoSeccionId,
        materiaId,
        profesorId,
        trimestreId,
        asistio
      } = updateAsistenciaDto;
    //Se crea un objeto para almacenar los datos a actualizar.
    const updateData: any = {}; //  ¡Usamos 'any' aquí, pero construimos el objeto correctamente!

    // Actualizaciones de campos simples (si existen)
    if (estado !== undefined) updateData.estado = estado;
    if (fecha !== undefined) updateData.fecha = fecha; //Ya llega como tipo Date
    if (asistio !== undefined) updateData.asistio = asistio;

    //Si se actualiza el id de la materia, verificar que exista.
    if (materiaId && materiaId !== asistencia.materiaId) {
        const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
        if (!materia) throw new BadRequestException('Materia inválida');
        updateData.materia = {connect: {id: materiaId}} //CONECTAR
    }

    //Si se actualiza el id del gradoSeccion, verificar que exista.
    if (gradoSeccionId && gradoSeccionId !== asistencia.gradoSeccionId) {
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
        if (!gradoSeccion) throw new BadRequestException('GradoSeccion inválido');
        updateData.gradoSeccion = { connect: { id: gradoSeccionId } }; //CONECTAR
    }

    //Si se actualiza el id del profesor, verificar que exista.
    if (profesorId !== undefined && profesorId !== asistencia.profesorId) {
        if(profesorId === null){ //Si se pasa null, se elimina la relación.
           updateData.profesor = {disconnect: true}
        } else {
            const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
        if (!profesor) throw new BadRequestException('Profesor inválido');
        updateData.profesor = { connect: { id: profesorId } }; //  ¡Conectar si existe y no es null!
        }

    }
      //Si se actualiza el id del estudiante, verificar que exista.
    if (estudianteId !== undefined && estudianteId !== asistencia.estudianteId) {
        if(estudianteId === null){ //Si se pasa null, se elimina la relación.
           updateData.estudiante = { disconnect: true };
        }
        const estudiante = await this.prisma.estudiante.findUnique({ where: { id: estudianteId } });
        if (!estudiante) throw new BadRequestException('Estudiante inválido');
        updateData.estudiante = { connect: { id: estudianteId } };
    }

    //Si se actualiza el id del trimestre, verificar que exista.
    if (trimestreId && trimestreId !== asistencia.trimestreId) {
        const trimestre = await this.prisma.trimestre.findUnique({ where: { id: trimestreId } });
        if (!trimestre) throw new BadRequestException('Trimestre inválido');
        updateData.Trimestre = {connect: {id: trimestreId}}
    }
    if (fecha !== undefined || gradoSeccionId !== undefined || materiaId !== undefined || estudianteId !== undefined) {
        const fechaInicio = startOfDay(new Date(fecha || asistencia.fecha));  // Usa la fecha nueva o la existente
        const fechaFin = endOfDay(new Date(fecha || asistencia.fecha));
        const updatedGradoSeccionId = gradoSeccionId !== undefined ? gradoSeccionId : asistencia.gradoSeccionId;
        const updatedMateriaId = materiaId !== undefined ? materiaId : asistencia.materiaId;
        const updatedEstudianteId = estudianteId !== undefined ? estudianteId : asistencia.estudianteId;


        const whereClause: any = {
            fecha: {
                gte: fechaInicio,
                lte: fechaFin,
            },
            gradoSeccionId: updatedGradoSeccionId,
            materiaId: updatedMateriaId,
            NOT: {
                id: id, //  ¡Excluye la asistencia actual de la búsqueda!
            },
        }
        //Asistencia grupal
        if(updatedEstudianteId === null){
            whereClause.estudianteId = null
        } else {
            whereClause.estudianteId = updatedEstudianteId
        }
        const asistenciaExistente = await this.prisma.asistencia.findFirst({
            where: whereClause,
        });

        if (asistenciaExistente) {
            throw new ConflictException('Ya existe un registro de asistencia con estos criterios.');
        }
    }
    // Actualizar la asistencia.
    return await this.prisma.asistencia.update({
        where: { id },
        data: updateData, //  ¡Usar el objeto updateData!
        include: {
            estudiante: {include:{user: true}},
            gradoSeccion: true,
            materia: true,
            profesor: {include: {user: true}},
            Trimestre: true
        }
    });
}
  async remove(id: number, user: User): Promise<Asistencia> {
    //Verificar roles
    if(!user.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos para realizar esta acción.')
    //Verificar si el examen existe.
    const asistencia = await this.prisma.asistencia.findUnique({ where: { id } });
    if (!asistencia) {
    throw new NotFoundException(`Asistencia con ID ${id} no encontrada`);
    }
    return await this.prisma.asistencia.delete({ where: { id } });
  }
}