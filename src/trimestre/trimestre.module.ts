import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'prisma.service';
import { TrimestresController } from './trimestre.controller';
import { TrimestresService } from './trimestre.service';

@Module({
     imports: [
            AuthModule, 
            PassportModule.register({ defaultStrategy: 'jwt' }), //  ¡IMPORTANTE! Configura Passport
          ],
  controllers: [TrimestresController],
  providers: [TrimestresService,PrismaService],
})
export class TrimestreModule {}
