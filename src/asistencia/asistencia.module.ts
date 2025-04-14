import { Module } from '@nestjs/common';
import { AsistenciasService } from './asistencia.service';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma.service';
import { AsistenciasController } from './asistencia.controller';

@Module({
  imports: [
                AuthModule, 
                PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
              ],
  controllers: [AsistenciasController],
  providers: [AsistenciasService,PrismaService],
})
export class AsistenciaModule {}
