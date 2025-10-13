import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
    app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // lanza error si se envían propiedades extra
      transform: true, // transforma los tipos automáticamente (según DTO)
    }),
  );
  
  const config = new DocumentBuilder()
    .setTitle('BackendBaseAPI')
    .setDescription('Documentación automática de la API de NestJS')
    .setVersion('1.0.0')
    .addBearerAuth() // 🔐 agrega JWT Auth si la usarás
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 📄 Ruta donde estará disponible Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, 
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
