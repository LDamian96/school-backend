import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User, Role } from '@prisma/client'; // Importa Role
import { Request, Response } from 'express'; //  ¡Importa Request!
import { CreateAuthDto } from './dto/create-auth.dto';
import { Auth } from './decorators/auth.decorator';
import { validRoles } from './interface/valid-roles';
import { LoginResponse } from './interface/login-cookie';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') //  ¡Ruta para registrar usuarios!
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto, );
  }

 

  @Post('login')
  async loginUser(
    @Body() loginauthDTO: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const { user, token, refreshToken } = await this.authService.login(
      loginauthDTO,
    );

    // REFRESH TOKEN (en cookie HTTP-only)
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      path: '/',  // Disponible para toda la aplicación en este dominio
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días (ejemplo)
    });

    // ACCESS TOKEN (en cookie HTTP-only)
    response.cookie('token', token, {  //  ¡Cookie para el token!
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora (ejemplo)
    });

    return { user, token, refreshToken };
  }


  @Get('verify-token')
  @UseGuards(AuthGuard()) //  ¡Protegido!
  verifyToken(@GetUser() user: User) {
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      console.log("VERIFY TOKEN", userWithoutPassword) //DEBUG

      return { valid: true, user: userWithoutPassword }; //  ¡Formato correcto!
  }
  @Post('refresh-token')
  async refreshToken(@Req() request: Request, @Res({passthrough: true}) res: Response): Promise<LoginResponse> { //Usar Req y Res
      const refreshToken = request.cookies['refreshToken'] //Obtener desde las cookies. ¡¡¡SIN signedCookies!!!
      if(!refreshToken) throw new UnauthorizedException('No refresh token provided') //Si no hay token

      const {user, token: newToken, refreshToken: newRefreshToken} = await this.authService.refreshToken(refreshToken) //Obtener la respuesta

      //REFRESH TOKEN
      res.cookie('refreshToken', newRefreshToken, { //Se estable la nueva cookie.
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'strict',
          path: '/',
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
       // TOKEN (también en una cookie HTTP-only)
      res.cookie('token', newToken, {  //  ¡Establece la cookie para el token!
        httpOnly: true,  //  ¡MUY IMPORTANTE!
        secure: process.env.NODE_ENV === 'production', // HTTPS en producción
        sameSite: 'strict',  // Protección CSRF
        path: '/',         // Disponible en toda la aplicación
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora (¡ajusta!)
      });

      return {user, token: newToken, refreshToken: newRefreshToken} //Se retorna
  }
  @Post('logout')
  @UseGuards(AuthGuard()) //Se debe proteger la ruta
  async logout(@Res({ passthrough: true }) response: Response) { //Usar Res para establecer la cookie.
    response.clearCookie('refreshToken') //Eliminar la cookie del refreshToken.
      response.clearCookie('token') //Eliminar la cookie
    return {message: 'Logged out successfully'}
  }
 

}