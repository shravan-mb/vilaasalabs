import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'https://vilaasalabs.com',
      'https://www.vilaasalabs.com',
      /\.vilaasalabs\.com$/,
      /\.vercel\.app$/,
    ],
    credentials: true,
  });

  // Serve uploaded files as static
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');

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
