import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';

import { AlertService } from './alert.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [EmailService, PushService, AlertService],
  exports: [EmailService, PushService, AlertService],
})
export class NotificationsModule {}
