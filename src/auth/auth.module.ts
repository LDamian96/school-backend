import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserRoleGuard } from './guards/guards.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({defaultStrategy:"jwt"}),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory:  (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: '2h' },
      }),
      inject: [ConfigService],
    }),


  ],

  controllers: [AuthController],
  providers: [AuthService,PrismaService,JwtStrategy,UserRoleGuard],
  exports:[JwtStrategy,PassportModule,JwtModule,UserRoleGuard]
})
export class AuthModule {}
