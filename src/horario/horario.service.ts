// src/horarios/horarios.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; // ¡Ajusta la ruta!
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { Horario, User } from '@prisma/client';

@Injectable()
export class HorariosService {
  constructor(private prisma: PrismaService) {}

  async create(createHorarioDto: CreateHorarioDto, user: User): Promise<Horario> {
    if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
      throw new UnauthorizedException('No tienes permiso para crear horarios.');
    }

    const { dia, hora_inicio, hora_fin, gradoSeccionId, materiaId, profesorId } = createHorarioDto;

    // Validar existencia de gradoSeccion, materia y profesor
    const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
    const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
    const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });

    if (!gradoSeccion) throw new BadRequestException('GradoSeccion no encontrado.');
    if (!materia) throw new BadRequestException('Materia no encontrada.');
    if (!profesor) throw new BadRequestException('Profesor no encontrado.');

    //Validar que no exista ya el horario
     const existingHorario = await this.prisma.horario.findFirst({
        where: {
            dia: dia,
            hora_inicio: hora_inicio,
            hora_fin: hora_fin,
            gradoSeccionId: gradoSeccionId,
            materiaId: materiaId,
            profesorId: profesorId
        }
     })

     if(existingHorario) throw new ConflictException('Ya existe este horario')

    return this.prisma.horario.create({
      data: {
        dia,
        hora_inicio,
        hora_fin,
        gradoSeccionId,
        materiaId,
        profesorId,
      },
      include: {  //  Incluir las relaciones
        gradoSeccion: true,
        materia: true,
        profesor: true,
      }
    });
  }

  async findAll(user: User): Promise<Horario[]> {
    if (user.roles.includes('ADMIN')) {
      return this.prisma.horario.findMany({
        include: { gradoSeccion: true, materia: true, profesor: true },
      });
    } else if (user.roles.includes('PROFESOR')) {
        // Obtener los horarios del profesor
        const profesor = await this.prisma.profesor.findUnique({
            where:{userId: user.id},
            select:{id: true} //Solo se necesita el id del profesor.
        })

        if(!profesor) throw new UnauthorizedException('No tienes permisos')

        return this.prisma.horario.findMany({
            where: {profesorId: profesor.id},
            include: { gradoSeccion: true, materia: true, profesor: true },
        })
    } else if(user.roles.includes('ESTUDIANTE')){
        // Obtener los horarios del estudiante.
        const estudiante = await this.prisma.estudiante.findUnique({
            where:{userId: user.id},
            include:{
                gradoSeccion:{
                    include:{
                        horarios: {
                            include:{
                                materia: true,
                                profesor: true
                            }
                        }
                    }
                }
            }
        })
        if(!estudiante) throw new UnauthorizedException('No tienes permisos')
        //Se retorna los horarios que tenga el gradoSeccion del estudiante.
        return estudiante.gradoSeccion.horarios;
    } else{
        throw new UnauthorizedException('No tienes permisos')
    }
  }

    async findOne(id: number, user: User): Promise<Horario> {
        const horario = await this.prisma.horario.findUnique({
        where: { id },
        include: { //Para retornar las relaciones
            gradoSeccion: true,
            materia: true,
            profesor: {
                include: {user: true} //Para acceder al usuario
            }
        },
        });

        if (!horario) {
        throw new NotFoundException(`Horario con ID ${id} no encontrado`);
        }

        // Lógica de autorización
        if (user.roles.includes('ADMIN')) {
        return horario; // Admin puede ver cualquier horario
        }
        //Si es profesor, verificar que el horario le pertenezca.
        if (user.roles.includes('PROFESOR') && user.id === horario.profesor.userId) {
            return horario;
        }

        //Si es un estudiante
        if(user.roles.includes('ESTUDIANTE')){
            //Se busca el estudiante, para verificar si tiene ese horario.
             const estudiante = await this.prisma.estudiante.findUnique({
                where: {userId: user.id},
                include:{
                    gradoSeccion: { //Se incluye la relación
                        include: {
                            horarios:{ //Se incluyen los horarios.
                                where: {id} //Se filtra por el id del horario.
                            }
                        }
                    }
                }
             })
            //Si el estudiante existe, tiene un gradoSeccion y dentro tiene horarios, se retorna.
             if(estudiante && estudiante.gradoSeccion && estudiante.gradoSeccion.horarios.length > 0){
                return horario;
             }
        }

        throw new UnauthorizedException('No tienes permiso para ver este horario');
    }

  async update(id: number, updateHorarioDto: UpdateHorarioDto, user: User): Promise<Horario> {
     if (!user.roles.includes('ADMIN') && !user.roles.includes('PROFESOR')) {
        throw new UnauthorizedException('No tienes permiso para actualizar horarios.');
    }
    const { dia, hora_inicio, hora_fin, gradoSeccionId, materiaId, profesorId } = updateHorarioDto;

    //Verificar si el horario existe.
    const horarioExistente = await this.prisma.horario.findUnique({where: {id}})
    if(!horarioExistente) throw new NotFoundException('Horario no encontrado')

    //Si es profesor, validar que sea su horario.
    if(user.roles.includes('PROFESOR')){
        const profesor = await this.prisma.profesor.findUnique({
            where: {userId: user.id},
            include: {horarios: true}
        })
        //Si el horario a actualizar no le pertenece, se lanza una excepción.
        if(!profesor || !profesor.horarios.find(horario => horario.id === id))
            throw new UnauthorizedException('No tienes permisos para actualizar este horario')
    }
    //Validaciones, si existe, se verifica la data nueva a actualizar.
    if (gradoSeccionId && gradoSeccionId !== horarioExistente.gradoSeccionId) {
        const gradoSeccion = await this.prisma.gradoSeccion.findUnique({ where: { id: gradoSeccionId } });
        if (!gradoSeccion) throw new BadRequestException('GradoSeccion inválido');
    }
     if (materiaId && materiaId !== horarioExistente.materiaId) {
        const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
        if (!materia) throw new BadRequestException('Materia inválida');
    }
     if (profesorId && profesorId !== horarioExistente.profesorId) {
        const profesor = await this.prisma.profesor.findUnique({ where: { id: profesorId } });
        if (!profesor) throw new BadRequestException('Profesor inválido');
    }

    //Se actualiza
    return await this.prisma.horario.update({
      where: { id },
      data: {
        dia,
        hora_inicio,
        hora_fin,
        gradoSeccionId,
        materiaId,
        profesorId
      },
      include: {  // Incluir las relaciones
        gradoSeccion: true,
        materia: true,
        profesor: true,
      }
    });
  }

  async remove(id: number, user:User): Promise<Horario> {
    //Verificar roles
    if(!user.roles.includes('ADMIN')) throw new UnauthorizedException('No tienes permisos.')

    const horario = await this.prisma.horario.findUnique({ where: { id } });
    if (!horario) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado`);
    }
    return await this.prisma.horario.delete({ where: { id } });
  }
}