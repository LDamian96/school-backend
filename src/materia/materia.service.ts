import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; //  ¡Ajusta la ruta!
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { User, Profesor, Estudiante, Materia, Prisma } from '@prisma/client';

@Injectable()
export class MateriasService {
  constructor(private prisma: PrismaService) {}

  async createMateria(createMateriaDto: CreateMateriaDto): Promise<Materia> {
    const { nombre, profesor, apellido,gradoSeccionId } = createMateriaDto;

    // Verificar si la materia ya existe.
    const existingMateria = await this.prisma.materia.findFirst({
      where: { nombre: nombre,gradoSeccionId: gradoSeccionId },
    });

    if (existingMateria) {
      throw new ConflictException('Ya existe una materia con este nombre.');
    }

    // Verificar si el profesor existe (si se proporcionan nombre y apellido).
    let profesorExistente: Profesor | null = null;
    if (profesor && apellido) {
      profesorExistente = await this.prisma.profesor.findFirst({
        where: { nombre: profesor, apellido: apellido },
      });
      if (!profesorExistente) {
        throw new BadRequestException('El profesor especificado no existe.');
      }
    }

    // Crear la materia (con o sin profesor asociado).
    const materia = await this.prisma.materia.create({
      data: {
        nombre,
        gradoSeccionId,
        profesores: profesorExistente
          ? { connect: { id: profesorExistente.id } }
          : undefined, // Conectar solo si profesorExistente != null
      },
      include: {
        profesores: true,
        gradoSeccion: true, // Incluir la información del profesor (si existe).
      },
    });
    return materia;
  }

  async getMaterias(user: User): Promise<Materia[]> {
    if (user.roles.includes('ADMIN')) {
      // Si es administrador, devuelve todas las materias.
      return await this.prisma.materia.findMany({
        include: { profesores: true },
      });
    } else if (user.roles.includes('PROFESOR')) {
      // Si es profesor, devuelve solo las materias que imparte.
      const profesor = await this.prisma.profesor.findUnique({
        where: { userId: user.id },
        include: { materias: true },
      });
      if (!profesor) {
        throw new UnauthorizedException(
          'No tienes permiso para ver materias.',
        ); // No debería de pasar.
      }
      return profesor.materias;
    } else if (user.roles.includes('ESTUDIANTE')) {
      // Si es estudiante, obtener sus materias a través de la relación con Estudiante.
      //Se llama a la función que obtiene las materias, pasando el id del usuario.
      return this.getMateriasByEstudianteId(user.id);
    } else {
      throw new UnauthorizedException('No tienes permiso para ver las materias');
    }
  }

 async getMateriaById(id: number, user: User): Promise<Materia> {
        const materia = await this.prisma.materia.findUnique({
            where: { id },
            include: { profesores: true }, // Incluir profesores si es necesario
        });

        if (!materia) {
            throw new NotFoundException('Materia no encontrada');
        }

        // Verificar permisos (ADMIN puede ver cualquier materia).
        if (user.roles.includes('ADMIN')) {
            return materia;
        }

        // Verificar si el profesor imparte la materia
        if (user.roles.includes('PROFESOR')) {
          const profesor = await this.prisma.profesor.findUnique({
            where: { userId: user.id },
            include: { materias: true },
          });
          if (profesor && profesor.materias.some((mat) => mat.id === id)) {
            return materia;
          } // Si imparte la materia.
        }

        // Verificar si el estudiante está en un grado/sección con la materia.
        if (user.roles.includes('ESTUDIANTE')) {
            const estudiante = await this.prisma.estudiante.findUnique({
                where: { userId: user.id },
                include: {
                    gradoSeccion: {
                        include: {
                            horarios: {
                                where: { materiaId: id } //Filtra por la materia
                            }
                        }
                    }
                }
            })

            //Verifica que el estudiante exista, que tenga un grado/seccion asignado, y que tenga al menos un horario con la materia.
            if(estudiante && estudiante.gradoSeccion && estudiante.gradoSeccion.horarios.length > 0) return materia;
            throw new UnauthorizedException('No tienes permiso para ver esta materia');

        }

        // Si no es ADMIN, PROFESOR o ESTUDIANTE (o no tiene permisos), lanzar error.
        throw new UnauthorizedException('No tienes permiso para ver esta materia');
    }

  async updateMateria(
    id: number,
    updateMateriaDto: UpdateMateriaDto,
  ): Promise<Materia> {
    const { nombre, profesor, apellido,gradoSeccionId } = updateMateriaDto;

    // Verificar si la materia existe.
    const materiaExistente = await this.prisma.materia.findUnique({
      where: { id },
      include: { profesores: true,gradoSeccion:true }, // Incluir profesores para la desconexión.
    });

    if (!materiaExistente) {
      throw new NotFoundException('Materia no encontrada');
    }

    // Verificar unicidad (nombre y gradoSeccionId).
    if (nombre || gradoSeccionId) { //Solo chequear si cambia el nombre o grado
      const existingMateria = await this.prisma.materia.findFirst({
          where: {
            nombre: nombre || materiaExistente.nombre, //Usa el nuevo nombre, o el existente si no se provee
            gradoSeccionId: gradoSeccionId || materiaExistente.gradoSeccionId,
            NOT: { id }, // Excluir la materia actual
          },
        });
        if (existingMateria) {
          throw new ConflictException('Ya existe otra materia con este nombre en este grado y sección.');
        }
  }
  if (gradoSeccionId) {
    const gradoSeccionExists = await this.prisma.gradoSeccion.findUnique({
    where: { id: gradoSeccionId },
    });

    if (!gradoSeccionExists) {
    throw new BadRequestException('El GradoSeccion especificado no existe.');
    }
}


    // Buscar el ID del profesor (solo si se proporcionan nombre y apellido).
    let profesorId: number | undefined = undefined;
    if (profesor && apellido) {
      const profesorExistente = await this.prisma.profesor.findFirst({
        where: { nombre: profesor, apellido: apellido },
      });

      if (!profesorExistente) {
        throw new BadRequestException('El profesor especificado no existe.');
      }
      profesorId = profesorExistente.id;
    }

    // Crear el objeto de datos para la actualización.
    const updateData: Prisma.MateriaUpdateInput = {
      nombre: nombre, // Actualiza el nombre si se proporciona.
      gradoSeccion: gradoSeccionId ? { connect: {id: gradoSeccionId} } : undefined, //Actualiza el gradoSeccion.

    };

    // Conectar o desconectar el profesor.
    if (profesorId !== undefined) {
      updateData.profesores = { connect: { id: profesorId } };
    } else if (profesor == "" || apellido === "") {
      // Si no se proporciona un nuevo profesor, desconectar el profesor existente (si lo hay).
      updateData.profesores = {
        disconnect: materiaExistente.profesores.map((p) => ({ id: p.id })),
      };
    }

    // Actualizar la materia.
    return await this.prisma.materia.update({
      where: { id },
      data: updateData,
      include: { profesores: true,gradoSeccion:true },
    });
  }
 async deleteMateria(id: number): Promise<Materia> {
        //Verificar que exista la materia.
        const materiaExistente = await this.prisma.materia.findUnique({
        where: { id },
        include:{
            profesores: true //Para la desconexión.
        }
        });

        if (!materiaExistente) {
        throw new NotFoundException('Materia no encontrada');
        }
        // Desconectar la materia de los profesores antes de eliminarla
        if(materiaExistente.profesores.length > 0){
            await this.prisma.materia.update({
                where: {id: materiaExistente.id},
                data:{
                    profesores:{
                        disconnect: materiaExistente.profesores.map(profesor => ({id: profesor.id}))
                    }
                }
            })
        }
    return await this.prisma.materia.delete({
      where: { id },
    });
  }
    async getMateriasByEstudianteId(estudianteId: string): Promise<Materia[]> {
        const estudiante = await this.prisma.estudiante.findUnique({
        where: { userId: estudianteId },  //  ¡Busca por userId!
        include: {
            gradoSeccion: {  // Incluye la información del grado y sección
            include: {
                horarios: { // Incluye los horarios
                include: {
                    materia: true, //  ¡Aquí obtenemos la materia!
                },
                },
            },
            },
        },
        });

        if (!estudiante) {
            throw new NotFoundException('Estudiante no encontrado');
        }

        // Extraer las materias de los horarios, y eliminar duplicados
        const materias: Materia[] = [];
        const materiasIds = new Set<number>(); //Evitar materias duplicadas.

        for (const horario of estudiante.gradoSeccion.horarios) {
            if(!materiasIds.has(horario.materia.id)){
                materias.push(horario.materia);
                materiasIds.add(horario.materia.id)
            }
        }

        return materias;
    }

}