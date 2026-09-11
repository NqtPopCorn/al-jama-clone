import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { ItemModule } from './modules/item/item.module';
import { TraceabilityModule } from './modules/traceability/traceability.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';
import { ReviewModule } from './modules/review/review.module';
import { AuditModule } from './modules/audit/audit.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    ProjectModule,
    ItemModule,
    TraceabilityModule,
    NotificationModule,
    CollaborationModule,
    ReviewModule,
    AuditModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
