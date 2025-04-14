import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'prisma.service';
import *as bcrypt from "bcrypt"
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtPayload } from './interface/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './interface/login-cookie';
import { User } from '@prisma/client';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService,private jwtservice:JwtService) {}
 // AuthService
async create(createAuthDto: CreateAuthDto) {
  try {
    const { password, email, roles, ...data } = createAuthDto;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) throw new BadRequestException('El correo ya existe');
    const userCreated = await this.prisma.user.create({
      data: {
        ...data,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        roles: roles && roles.length > 0 ? roles : ['ESTUDIANTE'], // Usar roles del DTO, o dar rol por defecto.
      },
    });
    const token = this.getJWTtoken({ id: userCreated.id }); // Generar token
    delete userCreated.password;
    return { ...userCreated, token }; // Devolver usuario y token
  } catch (error) {
    console.log(error);
    throw new BadRequestException('Error al crear usuario, revise los campos');
  }
}
  async login(logindto: LoginAuthDto): Promise<LoginResponse> { // Usa LoginResponse como tipo de retorno
    const { password, email } = logindto;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new UnauthorizedException('user not found');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('password incorrect');
    }

    delete user.password;
    return { //Ahora el return coincide con la interface
      user,
      token: this.getJWTtoken({ id: user.id }),
      refreshToken: this.getRefreshToken({ id: user.id }),
    };
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse>{
    try {
      const payload = this.jwtservice.verify(refreshToken,{
        secret: process.env.JWT_REFRESH_SECRET //Verificar con la clave del refresh token
      }) //Verificar y decodificar

      const user = await this.prisma.user.findUnique({
        where: {id: payload.id} //Busca por id
      })

      if(!user) throw new UnauthorizedException('Invalid refresh token') //Excepción.

      delete user.password; //Elimina el password

      return {
        user,
        token: this.getJWTtoken({id: user.id}), //Genera un nuevo JWT
        refreshToken: this.getRefreshToken({id: user.id}) //Genera un nuevo refresh token
      }

    } catch (error) {
        throw new UnauthorizedException('Invalid refresh token') //Excepción
    }
}
  async findAll() {
    try {
       const users = await this.prisma.user.findMany({})
     
       return users;
      
    } catch (error) {
      console.log(error);
    }
  }



  private getJWTtoken(payload:JwtPayload){

    const token=  this.jwtservice.sign(payload)
    return token;
  }

  private getRefreshToken(payload: JwtPayload){  // <--  Función privada
    const refreshToken = this.jwtservice.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET, //Clave secreta diferente
      expiresIn: '7d' //Tiempo de expiración mayor.
    })
    return refreshToken
}
  private habdleDBeRROR(error:any):never {
    if (error.code === "P2002"){
      throw new BadRequestException(error.meta)
    }
    else{
      throw new InternalServerErrorException("please check server")
    }
  }
  
}
