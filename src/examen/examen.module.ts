import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ExamenesController } from './examen.controller';
import { ExamenesService } from './examen.service';
import { PrismaService } from 'prisma.service';

@Module({  
   imports: [
          AuthModule, 
          PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
        ],

  controllers: [ExamenesController],
  providers: [ExamenesService,PrismaService],
})
export class ExamenModule {}
