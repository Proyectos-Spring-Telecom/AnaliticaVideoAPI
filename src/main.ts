import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Permitir todas las URLs; puedes poner un array de URLs específicas
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // lanza error si se envían propiedades extra
      transform: true,
       transformOptions: {
        enableImplicitConversion: true, // 👈 convierte "1" -> 1
      },
    }),
  );

  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(document);
});


  const config = new DocumentBuilder()
    .setTitle('Video Analítica')
    .setDescription('Documentación automática de la API de NestJS')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Introduce tu token JWT aquí',
      },
      'access-token',
    ).addServer('http://localhost:3000/api','local').addServer('https://springtelecom.mx/analiticaVideoAPI/api','produccion')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.setGlobalPrefix('api'); // prefijo global para todas las rutas
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
