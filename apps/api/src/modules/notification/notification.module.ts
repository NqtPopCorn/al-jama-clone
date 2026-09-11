import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
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
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'email',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationEventListener, EmailProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
