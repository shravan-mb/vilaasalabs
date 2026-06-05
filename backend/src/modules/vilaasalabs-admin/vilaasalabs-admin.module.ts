import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from '../../database/entities/institution.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { User } from '../../database/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { VilaasalabsAdminController } from './vilaasalabs-admin.controller';
import { VilaasalabsAdminService } from './vilaasalabs-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institution, User, Subscription]), MailModule],
  controllers: [VilaasalabsAdminController],
  providers: [VilaasalabsAdminService],
})
export class VilaasalabsAdminModule {}
