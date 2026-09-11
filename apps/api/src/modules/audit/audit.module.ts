import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditEventListener } from './listeners/audit-event.listener';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditService, AuditEventListener],
  exports: [AuditService],
})
export class AuditModule {}
