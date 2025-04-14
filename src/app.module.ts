import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EstudianteModule } from './estudiante/estudiante.module';
import { ProfesorModule } from './profesor/profesor.module';
import { ExamenModule } from './examen/examen.module';
import { TareaModule } from './tarea/tarea.module';
import { GradoModule } from './grado/grado.module';
import { MateriaModule } from './materia/materia.module';
import { TrimestreModule } from './trimestre/trimestre.module';
import { HorarioModule } from './horario/horario.module';
import { AsistenciaModule } from './asistencia/asistencia.module';

@Module({
  imports: [AuthModule,ConfigModule.forRoot(), 
    EstudianteModule, ProfesorModule, ExamenModule, TareaModule, GradoModule, MateriaModule, TrimestreModule, HorarioModule, AsistenciaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
