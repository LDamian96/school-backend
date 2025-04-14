import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma.service';
import { MateriasService } from './materia.service';
import { MateriasController } from './materia.controller';

@Module({
  imports: [
    AuthModule, //  ¡IMPORTANTE! Importa AuthModule (para la autenticación)
    PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
  ],
  controllers: [MateriasController],
  providers: [MateriasService,PrismaService],
})
export class MateriaModule {}
