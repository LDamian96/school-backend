import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma.service';
import { GradoController } from './grado.controller';
import { GradoService } from './grado.service';
import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
        AuthModule, //  ¡IMPORTANTE! Importa AuthModule (para la autenticación)
        PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
      ],
  controllers: [GradoController],
  providers: [GradoService,PrismaService],
})
export class GradoModule {}
