
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { PrismaService } from 'prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    configservice:ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configservice.get("JWT_SECRET"),
    });
  }


  async validate(payload: JwtPayload):Promise<User> {
    const{id} =payload;
    const user= await this.prisma.user.findUnique({where:{id: id}})
    if(!user){
        throw new UnauthorizedException('token not valid');
    }
    if(!user.isActive){
        throw new UnauthorizedException('User is inactive');
    }
    delete user.password;

    return user;
    //return { userId: payload.sub, username: payload.username };
  }
}
