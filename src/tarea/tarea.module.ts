import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma.service';
import { TareasController } from './tarea.controller';
import { TareasService } from './tarea.service';

@Module({
  imports: [
            AuthModule, 
            PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
          ],
  controllers: [TareasController],
  providers: [TareasService,PrismaService],
})
export class TareaModule {}
