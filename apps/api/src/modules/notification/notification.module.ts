import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationEventListener } from './listeners/notification-event.listener';
import { EmailProcessor } from './processors/email.processor';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationEventListener, EmailProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
