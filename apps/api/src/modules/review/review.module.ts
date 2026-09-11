import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewInitiationService } from './services/review-initiation.service';
import { ReviewExecutionService } from './services/review-execution.service';
import { ReviewCommentService } from './services/review-comment.service';
import { ReviewQueryService } from './services/review-query.service';
import { ReviewParticipantGuard } from '../../common/guards/review-participant.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [
    ReviewInitiationService,
    ReviewExecutionService,
    ReviewCommentService,
    ReviewQueryService,
    ReviewParticipantGuard,
  ],
  exports: [
    ReviewInitiationService,
    ReviewExecutionService,
    ReviewCommentService,
    ReviewQueryService,
  ],
})
export class ReviewModule {}
