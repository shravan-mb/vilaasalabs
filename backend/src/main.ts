import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Role } from './common/enums/role.enum';
import { User } from './database/entities/user.entity';

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

  await seedSuperAdminIfMissing(app.get(DataSource));
}

async function seedSuperAdminIfMissing(dataSource: DataSource) {
  try {
    const repo = dataSource.getRepository(User);
    const exists = await repo.findOne({ where: { email: 'admin@vilaasalabs.com' } });
    if (!exists) {
      await repo.save(repo.create({
        role: Role.VILAASALABS_SUPER_ADMIN,
        name: 'Vilaasalabs Super Admin',
        email: 'admin@vilaasalabs.com',
        password_hash: await bcrypt.hash('Vilaasalabs@2026', 12),
        institution_id: null,
        is_active: true,
      }));
      console.log('✅ Super admin seeded: admin@vilaasalabs.com');
    }
  } catch (e) {
    console.error('Super admin seed skipped:', (e as Error).message);
  }
}

bootstrap();
