import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from './database/entities/academic-year.entity';
import { Announcement } from './database/entities/announcement.entity';
import { Attendance } from './database/entities/attendance.entity';
import { Class } from './database/entities/class.entity';
import { Institution } from './database/entities/institution.entity';
import { MeetingRequest } from './database/entities/meeting-request.entity';
import { PasswordResetToken } from './database/entities/password-reset-token.entity';
import { ProctorNote } from './database/entities/proctor-note.entity';
import { Question } from './database/entities/question.entity';
import { StudentParent } from './database/entities/student-parent.entity';
import { Subject } from './database/entities/subject.entity';
import { Subscription } from './database/entities/subscription.entity';
import { Test } from './database/entities/test.entity';
import { TestResult } from './database/entities/test-result.entity';
import { TimetableSlot } from './database/entities/timetable-slot.entity';
import { User } from './database/entities/user.entity';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { ClassesModule } from './modules/classes/classes.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { MailModule } from './modules/mail/mail.module';
import { ProfileModule } from './modules/profile/profile.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { StudentParentModule } from './modules/student-parent/student-parent.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TestResultsModule } from './modules/test-results/test-results.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { UsersModule } from './modules/users/users.module';
import { VilaasalabsAdminModule } from './modules/vilaasalabs-admin/vilaasalabs-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]), // 10 req/min on auth routes

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME', 'eduvilaasa'),
        entities: [
          Institution, User, Subscription, Attendance, Question,
          Class, Subject, StudentParent, Test,
          PasswordResetToken, TestResult, Announcement, TimetableSlot, AcademicYear,
          ProctorNote, MeetingRequest,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    AuthModule,
    InstitutionsModule,
    VilaasalabsAdminModule,
    UsersModule,
    ClassesModule,
    AttendanceModule,
    QuestionBankModule,
    SubscriptionsModule,
    StudentParentModule,
    MailModule,
    BillingModule,
    ProfileModule,
    TestResultsModule,
    AnnouncementsModule,
    TimetableModule,
    AcademicYearsModule,
  ],
})
export class AppModule {}
