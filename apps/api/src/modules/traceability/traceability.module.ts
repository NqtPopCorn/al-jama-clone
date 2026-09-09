import { Module } from '@nestjs/common';
import { TraceabilityService } from './traceability.service';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityEventListener } from './traceability-event.listener';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [ProjectModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityService, TraceabilityEventListener],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
