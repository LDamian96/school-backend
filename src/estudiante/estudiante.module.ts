import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'src/auth/auth.module';
import { EstudiantesController } from './estudiante.controller';
import { EstudiantesService } from './estudiante.service';
import { PrismaService } from 'prisma.service';

@Module({
   imports: [
      AuthModule, //  ¡IMPORTANTE! Importa AuthModule (para la autenticación)
      PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
    ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService,PrismaService],
})
export class EstudianteModule {}
