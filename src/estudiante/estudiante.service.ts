import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; //  ¡Ajusta la ruta si es necesario!
import { CreateEstudianteDto } from './dto/create-estudiante.dto';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto';
import { Estudiante, User, Materia, Prisma, GradoSeccion, Horario, Asistencia } from '@prisma/client'; //  ¡Importante!
import * as bcrypt from 'bcrypt';

@Injectable()
export class EstudiantesService {
  constructor(private prisma: PrismaService) {}

  async create(createEstudianteDto: CreateEstudianteDto, user: User): Promise<Estudiante> {
    // Verificar que el usuario sea admin
    if (!user.roles.includes('ADMIN')) {
      throw new UnauthorizedException('No tienes permisos para crear un estudiante');
    }

    const { email, password, nombre, apellido, gradoSeccionId, isActive, phone, address,sex } = createEstudianteDto;

    // Verificar si el correo electrónico ya está en uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está en uso.');
    }

    // Crear el usuario
    const newUser = await this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: await bcrypt.hash(password, 10), //  ¡Hashear la contraseña!
        fullName: `${nombre} ${apellido}`,
        roles: ['ESTUDIANTE'],  //  ¡Asigna el rol USER!
        isActive: true, //Por defecto
      },
    });

    // Verificar si el gradoSeccionId existe
    const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
      where: { id: gradoSeccionId },
    });

    if (!gradoSeccion) {
      throw new BadRequestException('El GradoSeccion especificado no existe.');
    }

    // Crear el estudiante
    return this.prisma.estudiante.create({ //Se retorna directamente.
      data: {
        nombre,
        apellido,
        gradoSeccionId,
        sex,
        phone,
        address,
        isActive: isActive !== undefined ? isActive : true,
        userId: newUser.id,  //  ¡Relaciona con el User creado!
      },
      include: { //Para retornar la información del usuario creado.
        user: true,
        gradoSeccion: true
      }
    });
  }
    async findAll(requestingUser: User): Promise<Estudiante[]> {
    if (!requestingUser.roles.includes('ADMIN')) {
        throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
    }
    return this.prisma.estudiante.findMany({
      where:{isActive: true}, //Solo los activos
      include: {
        user: true, // Incluir datos del usuario
        gradoSeccion: true, // Incluir grado y sección
        // Puedes incluir otras relaciones si las necesitas en la lista
      },
    });
  }

  async findOne(userId: string, requestingUser: User): Promise<Estudiante> {
     // Verificar que el usuario que hace la petición tiene permiso.
    if (!requestingUser.roles.includes('ADMIN') && requestingUser.id !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para ver la información de este estudiante',
      );
    }
    //Se busca por userId, no por el id de la tabla.
    const estudiante = await this.prisma.estudiante.findUnique({
        where: { userId: userId },
        include: {
            user: true,
            Asistencia: true,
            gradoSeccion: true,
            Tarea: true,
            Examen: true,
        },
    });
    if(!estudiante) throw new NotFoundException('Estudiante no encontrado')
    return estudiante;
  }

  async update(userId: string, updateEstudianteDto: UpdateEstudianteDto, requestingUser: User): Promise<Estudiante> {
    if (!requestingUser.roles.includes('ADMIN')) {
      throw new UnauthorizedException('No tienes permisos para realizar esta acción');
    }

    //  ¡MUY IMPORTANTE!  Desestructuramos *todos* los campos posibles de UpdateEstudianteDto
    const { nombre, apellido, gradoSeccionId, phone, address, isActive, email, password, sex} = updateEstudianteDto; //Se agrega el gradoSeccionID

    // Buscar el estudiante existente (por userId), incluyendo la relación con user
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    // 1. Actualizar la información del USUARIO (si es necesario)
    const userData: Prisma.UserUpdateInput = {};

    if (email !== undefined && email !== estudiante.user.email) {
      //Verificación de email
      const existingUser = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existingUser && existingUser.id !== estudiante.userId) {
        throw new BadRequestException('El correo electrónico ya está en uso por otro usuario.');
      }
      userData.email = email.toLowerCase().trim();
    }

    if (password !== undefined) {
      userData.password = await bcrypt.hash(password, 10);
    }
    //Si se actualiza el nombre y apellido, se actualiza el fullName.
    if (nombre !== undefined || apellido !== undefined) {
      userData.fullName = `${nombre || estudiante.nombre} ${apellido || estudiante.apellido}`;
    }
    

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: estudiante.userId },
        data: userData,
      });
    }

    // 2. Actualizar la información del ESTUDIANTE (si es necesario)

    const estudianteData: Prisma.EstudianteUpdateInput = {};

    if (nombre !== undefined) {
      estudianteData.nombre = nombre;
    }
    if (apellido !== undefined) {
      estudianteData.apellido = apellido;
    }
    if (phone !== undefined) {
      estudianteData.phone = phone;
    }
    if (address !== undefined) {
      estudianteData.address = address;
    }
    if (isActive !== undefined) {
      estudianteData.isActive = isActive;
    }
    if (sex !== undefined) {
      estudianteData.sex=sex; 
    }

        //  ¡Manejo de gradoSeccionId!
        if (gradoSeccionId !== undefined) {
          const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
            where: { id: gradoSeccionId },
          });
          if (!gradoSeccion) {
            throw new BadRequestException('El GradoSeccion especificado no existe.');
          }
          estudianteData.gradoSeccion = { connect: { id: gradoSeccionId } }; //  ¡CORREGIDO!
        }

        return await this.prisma.estudiante.update({
          where: { userId },
          data: estudianteData,
          include: {
            user: true,
            gradoSeccion: true,
          },
        });

  }
      //Se eliminó la función de getMaterias, ya que ahora se obtiene a través de la relación anidada.
    // --- Otras funciones (obtener materias, tareas, etc.) ---
  

    async remove(userId: string, requestingUser:User): Promise<Estudiante> {
      //Verificar si el usuario es admin
        if(!requestingUser.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos para realizar esta acción')
        const estudiante = await this.prisma.estudiante.findUnique({
            where: { userId },
        });

        if (!estudiante) {
            throw new NotFoundException('Estudiante no encontrado');
        }

        //Se actualiza el estado.
        return this.prisma.estudiante.update({
            where:{userId: userId},
            data: {isActive: false}
        })
  }

  //filters

  async getMaterias(userId: string, user: User): Promise<Materia[]> {
    //  ¡Verificación de permisos!  Solo el propio estudiante o un ADMIN pueden acceder.
    if (!user.roles.includes('ADMIN') && user.id !== userId) {
        throw new UnauthorizedException('No tienes permiso para ver las materias de este estudiante.');
    }
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { userId: userId },
      include: {
        gradoSeccion: {
          include: {
            horarios: {
              include: {
                materia: true,
              },
            },
          },
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado.');
    }

    if (!estudiante.gradoSeccion) {
        return []; // Si no está asignado, no hay materias
    }

    // Extraer las materias de los horarios (y eliminar duplicados)
        const materias: Materia[] = [];
        const materiasIds = new Set<number>();

        for (const horario of estudiante.gradoSeccion.horarios) {
            if(!materiasIds.has(horario.materia.id)){ //Si la materia no existe.
                materias.push(horario.materia);
                materiasIds.add(horario.materia.id)
            }
        }

        return materias;
  }

    async getGradoSeccion(userId: string, user:User): Promise<GradoSeccion> {
         //  ¡Verificación de permisos!  Solo el propio estudiante o un ADMIN pueden acceder.
        if (!user.roles.includes('ADMIN') && user.id !== userId) {
            throw new UnauthorizedException('No tienes permiso para ver el grado/sección de este estudiante.');
        }
        const estudiante = await this.prisma.estudiante.findUnique({
        where: { userId: userId },
        include: { gradoSeccion: true }, //  ¡Incluir gradoSeccion!
        });

        if (!estudiante?.gradoSeccion) {
        throw new NotFoundException('Estudiante no encontrado o no tiene grado/sección asignado.');
        }

        return estudiante.gradoSeccion;
    }

    async getHorarios(userId: string, user:User): Promise<Horario[]> {
        //Verificar roles.
        if (!user.roles.includes('ADMIN') && user.id !== userId) {
            throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
        }
        const estudiante = await this.prisma.estudiante.findUnique({
            where: { userId },
            include: { gradoSeccion: { include: { horarios: true } } }, //  ¡Incluir horarios!
        });

        if (!estudiante) {
        throw new NotFoundException('Estudiante no encontrado.');
        }
        //Si no tiene grado y sección asignado.
        if(!estudiante.gradoSeccion) return [];
        //Se retorna directamente los horarios
        return estudiante.gradoSeccion.horarios;
    }

    async getAsistencias(userId: string, requestingUser: User): Promise<Asistencia[]> {
      // 1. Autorización (ya implementada y correcta)
      if (!requestingUser.roles.includes('ADMIN') && requestingUser.id !== userId) {
          throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
      }
  
      // 2. Lógica para obtener las asistencias
      if (requestingUser.roles.includes('ADMIN')) {
          // Si es un ADMIN, devuelve todas las asistencias
          return this.prisma.asistencia.findMany({
              include: {
                  estudiante: { include: { user: true } },
                  gradoSeccion: true,
                  materia: true,
                  profesor: { include: { user: true } },
                  Trimestre: true,
              },
          });
      } else {
          // Si es un ESTUDIANTE, busca su información y filtra
          const estudiante = await this.prisma.estudiante.findUnique({
              where: { userId: requestingUser.id }, //  ¡Usa requestingUser.id!
              select: { id: true, gradoSeccionId: true },
          });
  
          if (!estudiante) {
              throw new NotFoundException('Estudiante no encontrado.');
          }
  
          return this.prisma.asistencia.findMany({
              where: {
                  OR: [
                      { estudianteId: estudiante.id }, // Asistencias individuales
                      { gradoSeccionId: estudiante.gradoSeccionId }, // Asistencias del grado/sección
                  ],
              },
              include: {
                  estudiante: { include: { user: true } },
                  gradoSeccion: true,
                  materia: true,
                  profesor: { include: { user: true } },
                  Trimestre: true,
              },
          });
      }
    }
}