import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma.service';
import { HorariosController } from './horario.controller';
import { HorariosService } from './horario.service';

@Module({
    imports: [
              AuthModule, 
              PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
            ],
  controllers: [HorariosController],
  providers: [HorariosService,PrismaService],
})
export class HorarioModule {}
