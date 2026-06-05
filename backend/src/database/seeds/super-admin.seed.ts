import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../../app.module';
import { Role } from '../../common/enums/role.enum';
import { User } from '../entities/user.entity';
import { DataSource } from 'typeorm';

async function seedSuperAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const email = 'admin@vilaasalabs.com';
  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log('Super admin already exists. Skipping seed.');
    await app.close();
    return;
  }

  const passwordHash = await bcrypt.hash('Vilaasalabs@2026', 12);

  await userRepo.save(
    userRepo.create({
      role: Role.VILAASALABS_SUPER_ADMIN,
      name: 'Vilaasalabs Super Admin',
      email,
      password_hash: passwordHash,
      institution_id: null,
    }),
  );

  console.log('✅ Super admin created successfully');
  console.log('   Email:    admin@vilaasalabs.com');
  console.log('   Password: Vilaasalabs@2026');
  console.log('   ⚠️  Change this password after first login!');

  await app.close();
}

seedSuperAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
