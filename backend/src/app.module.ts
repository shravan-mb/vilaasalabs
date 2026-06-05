import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './database/entities/attendance.entity';
import { Institution } from './database/entities/institution.entity';
import { Question } from './database/entities/question.entity';
import { Subscription } from './database/entities/subscription.entity';
import { User } from './database/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { VilaasalabsAdminModule } from './modules/vilaasalabs-admin/vilaasalabs-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME', 'eduvilaasa'),
        entities: [Institution, User, Subscription, Attendance, Question],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,
    InstitutionsModule,
    VilaasalabsAdminModule,
  ],
})
export class AppModule {}
