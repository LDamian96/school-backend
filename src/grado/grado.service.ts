// src/system-schools/system-schools.service.ts
import {
  BadRequestException,
  ConflictException, //  ¡Importante para duplicados!
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma.service'; // ¡Ajusta la ruta!
import {  GradoSeccion, User } from '@prisma/client';
import { CreateGradoSeccionDto } from './dto/create-grado.dto';
import { UpdateGradoDto } from './dto/update-grado.dto';
// ... (otras importaciones) ...

@Injectable()
export class GradoService {
  constructor(private prisma: PrismaService) {}
  // ... (otras funciones)
    // --- GRADO SECCION ---
  async createGradoSeccion(createGradoSeccionDto: CreateGradoSeccionDto): Promise<GradoSeccion> {
      const { grado, seccion, nivel } = createGradoSeccionDto;

      //Validación para evitar duplicados.
      const existingGradoSeccion = await this.prisma.gradoSeccion.findFirst({
          where: { grado, seccion, nivel },
      });
      if (existingGradoSeccion) {
          throw new ConflictException('Ya existe un GradoSeccion con esta combinación.');
      }

      return this.prisma.gradoSeccion.create({
          data: { grado, seccion, nivel,},
      });
  }

    async AllGrado(user: User): Promise<GradoSeccion[]> {
      // Solo los administradores pueden ver todos los grados.
      if (!user.roles.includes('ADMIN')) {
          throw new UnauthorizedException('No tienes permiso para ver todos los grados.');
      }
      return await this.prisma.gradoSeccion.findMany({include:{
        
        estudiantes:true,
        Trimestre:true,
        horarios:true,

      }});
  }

  async getGradoSeccionById(id: number): Promise<GradoSeccion> { //Para obtener por id.
      const gradoSeccion = await this.prisma.gradoSeccion.findUnique({
        where: { id },
      });
      if (!gradoSeccion) {
        throw new NotFoundException(`GradoSeccion con ID ${id} no encontrado.`);
      }
      return gradoSeccion;
    }

  async updateGradoSeccion(id: number, updateGradoSeccionDto: UpdateGradoDto): Promise<GradoSeccion> {
      const { grado, seccion, nivel } = updateGradoSeccionDto;
        // Verificar si existe el GradoSeccion
      const existingGradoSeccion = await this.prisma.gradoSeccion.findUnique({
      where: { id },
      });

      if (!existingGradoSeccion) {
      throw new NotFoundException(`GradoSeccion con ID ${id} no encontrado.`);
      }
      // Validar si existe la combinación (excluyendo el actual)
      if (grado || seccion || nivel) { // Solo si se intenta modificar
          const duplicate = await this.prisma.gradoSeccion.findFirst({
          where: {
              grado: grado || existingGradoSeccion.grado, // Usar nuevo valor o el anterior
              seccion: seccion || existingGradoSeccion.seccion,
              nivel: nivel || existingGradoSeccion.nivel,
              NOT: { id }, // Excluir el registro actual de la búsqueda
          },
          });

          if (duplicate) {
          throw new ConflictException('Ya existe un GradoSeccion con esta combinación.');
          }
      }


      return this.prisma.gradoSeccion.update({
          where: { id },
          data: { grado, seccion, nivel }, // Actualiza solo los campos proporcionados
      });
  }

  async deleteGradoSeccion(id: number): Promise<GradoSeccion> {
      //Verificar si el gradoSeccion existe
      const existingGradoSeccion = await this.prisma.gradoSeccion.findUnique({
      where: { id },
      });

      if (!existingGradoSeccion) {
      throw new NotFoundException(`GradoSeccion con ID ${id} no encontrado.`);
      }
      return this.prisma.gradoSeccion.delete({
      where: { id },
      });
  }
}