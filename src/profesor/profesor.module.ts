import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ProfesoresController } from './profesor.controller';
import { ProfesoresService } from './profesor.service';
import { PrismaService } from 'prisma.service';

@Module({
   imports: [
          AuthModule, 
          PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
        ],
  controllers: [ProfesoresController],
  providers: [ProfesoresService,PrismaService],
})
export class ProfesorModule {}
