// src/profesores/profesores.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; // Ajusta la ruta
import { CreateProfesorDto } from './dto/create-profesor.dto';
import { UpdateProfesorDto } from './dto/update-profesor.dto';
import { Profesor, User, Prisma, Materia, GradoSeccion, Horario, Examen, Tarea, Asistencia } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfesoresService {
  constructor(private prisma: PrismaService) {}

  async create(createProfesorDto: CreateProfesorDto, user: User): Promise<Profesor> {
    if (!user.roles.includes('ADMIN')) {
      throw new UnauthorizedException('No tienes permisos para crear un profesor.');
    }

    const { email, password, nombre, apellido, isActive, phone, address,sex } = createProfesorDto;

    // Verificar si el correo electrónico ya está en uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está en uso.');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: await bcrypt.hash(password, 10),
        fullName: `${nombre} ${apellido}`,
        roles: ['PROFESOR'], // Rol de profesor
        isActive: true,
      },
    });

    return this.prisma.profesor.create({
      data: {
        nombre,
        apellido,
        phone,
        address,
        sex,
        isActive: isActive !== undefined ? isActive : true,
        userId: newUser.id,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll(requestingUser: User): Promise<Profesor[]> {
    if (!requestingUser.roles.includes('ADMIN')) {
        throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
    }
    return this.prisma.profesor.findMany({
      where:{isActive: true}, //Solo los activos

      include: {
        horarios: true, // Incluir horarios
        materias: true, // Incluir materias
        Tarea: true, // Incluir tareas
        user: true, // Incluir datos del usuario
        // Puedes incluir otras relaciones si las necesitas (materias, horarios, etc.)
      },
    });
  }

  async findOne(userId: string, requestingUser: User): Promise<Profesor> {
     if (!requestingUser.roles.includes('ADMIN') && requestingUser.id !== userId) {
        throw new UnauthorizedException(
          'No tienes permiso para ver la información de este profesor',
        );
      }
    const profesor = await this.prisma.profesor.findUnique({
        where: { userId: userId },
        include: {  //Incluir todas las relaciones.
            user: true,
            materias: true,
            horarios: true,
            Asistencia: true,
            Examen:true,
            Tarea: true
        }
    });
    if(!profesor) throw new NotFoundException('Profesor no encontrado')
    return profesor;
  }

  async update(userId: string, updateProfesorDto: UpdateProfesorDto, requestingUser: User): Promise<Profesor> {
    if (!requestingUser.roles.includes('ADMIN')) {
      throw new UnauthorizedException('No tienes permisos para realizar esta acción');
    }
      const { nombre, apellido,  phone, address, isActive, email, password, roles,sex } = updateProfesorDto;

    const profesor = await this.prisma.profesor.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profesor) {
      throw new NotFoundException('Profesor no encontrado');
    }

    // Actualizar información del usuario
    const userData: Prisma.UserUpdateInput = {};

    if (email !== undefined && email !== profesor.user.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existingUser && existingUser.id !== profesor.userId) {
        throw new BadRequestException('El correo electrónico ya está en uso por otro usuario.');
      }
      userData.email = email.toLowerCase().trim();
    }

    if (password !== undefined) {
      userData.password = await bcrypt.hash(password, 10);
    }

    if (nombre !== undefined || apellido !== undefined) {
      userData.fullName = `${nombre || profesor.nombre} ${apellido || profesor.apellido}`;
    }
        //Si se agrega actualizacion de roles.
    if(roles !== undefined) userData.roles = roles;

    if (Object.keys(userData).length > 0) {
      await this.prisma.user.update({
        where: { id: profesor.userId },
        data: userData,
      });
    }

    // Actualizar información del profesor
    const profesorData: Prisma.ProfesorUpdateInput = {};
    if (nombre !== undefined) profesorData.nombre = nombre;
    if (apellido !== undefined) profesorData.apellido = apellido;
    if (phone !== undefined) profesorData.phone = phone;
    if (address !== undefined) profesorData.address = address;
    if (isActive !== undefined) profesorData.isActive = isActive;
    if (sex !== undefined) profesorData.sex = sex;



    return await this.prisma.profesor.update({
      where: { userId: userId },
      data: profesorData,
       include: { //Para retornar la información del usuario actualizado
            user: true,
        },
    });
  }

  async remove(userId: string, requestingUser:User): Promise<Profesor> {
      //Verificar si el usuario es admin
    if(!requestingUser.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos para realizar esta acción')
    const profesor = await this.prisma.profesor.findUnique({
        where: { userId },
    });

    if (!profesor) {
        throw new NotFoundException('Profesor no encontrado');
    }
    //Se actualiza el estado.
    return this.prisma.profesor.update({
        where:{userId: userId},
        data: {isActive: false}
    })
  }

  //get filters

  async getMaterias(userId: string): Promise<Materia[]> {
    const profesor = await this.prisma.profesor.findUnique({
        where: { userId: userId },
        include: { materias: true }, //  ¡Incluye las materias!
    });

    if (!profesor) {
        throw new NotFoundException('Profesor no encontrado.');
    }
    return profesor.materias;  //  ¡Devuelve directamente el array de materias!
}



// En profesores.service.ts
async getGradosSecciones(userId: string): Promise<GradoSeccion[]> {
  const profesor = await this.prisma.profesor.findUnique({
      where: { userId },
      select: { id: true } // Solo necesitamos el ID del profesor
  });

  if (!profesor) {
    throw new NotFoundException('Profesor no encontrado.');
  }

  // Obtener los GradoSeccion a través de los Horarios y las Tareas
  const gradosSecciones = await this.prisma.gradoSeccion.findMany({
      where: {
          OR: [
              {
                  horarios: { // A través de los horarios
                      some: {
                          profesorId: profesor.id, // Horarios del profesor
                      },
                  },
              },
              {
                  Tarea: { // A través de las tareas (si quieres incluirlas)
                      some: {
                          profesorId: profesor.id, // Tareas creadas por el profesor
                      },
                  },
              },
          ],
      },
      include: {  // ¡Incluir las relaciones que necesites en el frontend!
          horarios: {  // Incluir los horarios para cada GradoSeccion
              include:{
                  materia: true //Si necesitas las materias.
              }
          },
          Tarea: true, // Incluir tareas
          estudiantes: true ,
            
      },
  });

  return gradosSecciones;
}
async getHorarios(userId: string): Promise<Horario[]> {
  const profesor = await this.prisma.profesor.findUnique({
    where: { userId },
    select: { id: true }, // Solo necesitamos el ID
  });

  if (!profesor) {
    throw new NotFoundException('Profesor no encontrado.');
  }

  return this.prisma.horario.findMany({
    where: {
      profesorId: profesor.id, //  ¡Filtra por profesorId!
    },
    include: { //  ¡Incluye solo las *relaciones*!
      gradoSeccion: true,
      materia: true,
      profesor: true, //  ¡No 'profesores'!  Es una relación *uno a uno*.
      Examen: true,
    },
  });
}


async findExamenesByProfesorAndGradoSeccion(
  userId: string, //Se cambia a string
  gradoSeccionId: number,
  user: User
): Promise<Examen[]> {
   //Verificar roles
  if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
  }

  //Si es profesor, verificar que pueda acceder
  if(user.roles.includes('PROFESOR') && user.id !== userId)
      throw new UnauthorizedException('No tienes permisos para acceder a esta información')

  //Verificar que existan.
  const profesor = await this.prisma.profesor.findUnique({where:{userId}, select:{id: true}})
  const gradoSeccionExists = await this.prisma.gradoSeccion.findUnique({where:{id: gradoSeccionId}})

  if(!profesor) throw new NotFoundException('Profesor no encontrado')
  if(!gradoSeccionExists) throw new NotFoundException('GradoSeccion no encontrado')
  return this.prisma.examen.findMany({ //Se buscan los examenes.
      where: {
          profesorId: profesor.id,  //  ¡Filtra por profesorId!
          gradoSeccionId,  //  ¡Filtra por gradoSeccionId!
      },
      include: { //Se incluyen las relaciones.
          materia: true,
          gradoSeccion: true,
          profesores: {include: {user: true}},
          estudiante: {include: {user: true}},
          horario: true,
          Trimestre: true
      },
  });
}
async findTareasByProfesorAndGradoSeccion(
  profesorUserId: string,  //  ¡Ahora recibe el userId (string)!
  gradoSeccionId: number,
  user: User,
): Promise<Tarea[]> {

  //Verficar roles
  if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para acceder a esta información.');
  }
   //Si es profesor, verificar que pueda acceder
  if(user.roles.includes('PROFESOR') && user.id !== profesorUserId)
      throw new UnauthorizedException('No tienes permisos para acceder a esta información')


  //Verificar que el profesor y el gradoSeccion existan
  const profesor = await this.prisma.profesor.findUnique({
      where: { userId: profesorUserId }, //  ¡Usa userId!
      select: {id: true}
  });
  const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
      where:{id: gradoSeccionId}
  })

  //Si no existe el profesor o el grado/sección, lanzar un error.
  if (!profesor) {
      throw new NotFoundException('Profesor no encontrado.');
  }
  if(!gradoSeccion) throw new NotFoundException('GradoSeccion no encontrado')


  return this.prisma.tarea.findMany({
    where: {
      profesorId: profesor.id,  //  ¡Filtra por el ID numérico del profesor!
      gradoSeccionId,       //  ¡Filtra por el ID numérico del gradoSeccion!
    },
    include: { //Relaciones a incluir
      materia: true,
      gradoSeccion: true,
      profesores: {include:{user: true}},
      estudiante: {include:{user:true}},
      Trimestre: true
    },
  });
}
async getAsistencias(userId: string, user: User): Promise<Asistencia[]> {
  //Si no es admin, y los id no coinciden, lanzar error.
  if(!user.roles.includes('ADMIN') && user.id !== userId)
      throw new UnauthorizedException('No tienes permisos para ver esta información.')

  const profesor = await this.prisma.profesor.findUnique({
      where: { userId },
      include: {
          materias: true,  // Obtener las materias del profesor
          horarios: {   // Obtener los horarios del profesor
              include: {
                  gradoSeccion: true, // Obtener los grados/secciones de los horarios
              },
          },
      },
  });

  if (!profesor) {
      throw new NotFoundException('Profesor no encontrado.');
  }

  // Obtener los IDs de las materias y los grados/secciones del profesor
  const materiaIds = profesor.materias.map((m) => m.id);
  const gradoSeccionIds = profesor.horarios.map(h => h.gradoSeccionId)
  //Se buscan todas las asistencias de un profesor, en las materias y grados/secciones que imparte.
  return this.prisma.asistencia.findMany({
      where: {
          profesorId: profesor.id,
          materiaId:{ //Que sea de las materias que imparte.
              in: materiaIds
          },
          gradoSeccionId:{ //Y que este en los grados y secciones que tiene.
              in: gradoSeccionIds
          }

      },
      include: {  //  ¡Incluir las relaciones!
          estudiante: {include: {user: true}},
          gradoSeccion: true,
          materia: true,
          profesor: {include: {user: true}},
          Trimestre: true
      },
  });
}
}