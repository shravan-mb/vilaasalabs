import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — rejects bad request bodies automatically
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // CORS — allow Angular dev server and production domains
  app.enableCors({
    origin: [
      'http://localhost:4200',   // vilaasalabs-web dev
      'http://localhost:4201',   // eduvilaasa-web dev
      'https://vilaasalabs.com',
      'https://app.eduvilaasa.com',
      /\.eduvilaasa\.com$/,      // any school subdomain
    ],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger docs — available at /api/v1/docs
  const config = new DocumentBuilder()
    .setTitle('EduVilaasa API')
    .setDescription('Backend API for EduVilaasa school management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`EduVilaasa backend running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/v1/docs`);
}
bootstrap();
