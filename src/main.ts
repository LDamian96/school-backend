import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'; // Importa cookie-parser

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted:true
  }),
);
app.enableCors({
  origin: ['http://localhost:3000'], // Orígenes permitidos (frontend)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true, // Permite enviar cookies en peticiones cross-origin
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'], // Añadir X-CSRF-Token aquí

});
app.setGlobalPrefix("system-schools")
app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
