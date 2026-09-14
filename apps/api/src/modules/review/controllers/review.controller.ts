import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ReviewInitiationService } from '../services/review-initiation.service';
import { ReviewExecutionService } from '../services/review-execution.service';
import { ReviewCommentService } from '../services/review-comment.service';
import { ReviewQueryService } from '../services/review-query.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { InitiateReviewDto } from '../dto/initiate-review.dto';
import { UpdateReviewItemStatusDto } from '../dto/update-review-item-status.dto';
import { BatchUpdateStatusDto } from '../dto/batch-update-status.dto';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { QueryReviewsDto } from '../dto/query-reviews.dto';
import { ReviewParticipantGuard } from '../../../common/guards/review-participant.guard';
import { ReviewRoles } from '../../../common/decorators/review-roles.decorator';
import { ReviewRole } from '@prisma/client';

@ApiTags('Review Center')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewController {
  constructor(
    private readonly initiationService: ReviewInitiationService,
    private readonly executionService: ReviewExecutionService,
    private readonly commentService: ReviewCommentService,
    private readonly queryService: ReviewQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách review cho Review Home Page' })
  async listReviews(@CurrentUser('id') userId: string, @Query() query: QueryReviewsDto) {
    const result = await this.queryService.listReviews(userId, query);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Tạo review mới (Draft hoặc Initiate ngay)' })
  async createReview(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    const review = await this.initiationService.createReview(dto, userId);
    return {
      success: true,
      data: review,
      message: 'Review created successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Lấy danh sách review templates của dự án' })
  async getTemplates(@CurrentUser('id') userId: string, @Query('projectId') projectId: string) {
    const templates = await this.queryService.getProjectTemplates(projectId, userId);
    return {
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy dữ liệu chi tiết cho màn hình Review Workspace' })
  async getReviewDetail(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const detail = await this.queryService.getReviewDetail(id, userId);
    return {
      success: true,
      data: detail,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/initiate')
  @UseGuards(ReviewParticipantGuard)
  @ReviewRoles(ReviewRole.MODERATOR)
  @ApiOperation({ summary: 'Khởi chạy review (chuyển sang ACTIVE, tạo revision 1, baseline)' })
  async initiateReview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateReviewDto,
  ) {
    const review = await this.initiationService.initiateReview(id, userId, dto);
    return {
      success: true,
      data: review,
      message: 'Review initiated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/items/:itemId/status')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Cập nhật trạng thái duyệt của một item' })
  async updateItemStatus(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReviewItemStatusDto,
  ) {
    const result = await this.executionService.updateItemStatus(id, itemId, userId, dto);
    return {
      success: true,
      data: result,
      message: 'Item status updated',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/items/batch-status')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Cập nhật trạng thái hàng loạt cho nhiều items' })
  async batchUpdateItemStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BatchUpdateStatusDto,
  ) {
    const result = await this.executionService.batchUpdateItemStatus(id, userId, dto);
    return {
      success: true,
      data: result,
      message: 'Batch status updated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/complete')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: "Hoàn tất review của cá nhân (I'm Finished)" })
  async completeReview(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.executionService.completeReview(id, userId);
    return {
      success: true,
      data: result,
      message: 'Review marked as finished',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/items/:itemId/comments')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Lấy danh sách comments của 1 review item' })
  async getItemComments(
    @Param('itemId') itemId: string,
    @Query('revisionNumber') revisionNumber?: number,
  ) {
    const comments = await this.commentService.getItemComments(
      itemId,
      revisionNumber ? Number(revisionNumber) : undefined,
    );
    return {
      success: true,
      data: comments,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/items/:itemId/comments')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Tạo comment mới cho review item' })
  async createComment(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewCommentDto,
  ) {
    const comment = await this.commentService.createComment(id, itemId, userId, dto);
    return {
      success: true,
      data: comment,
      message: 'Comment added successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/comments')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Lấy toàn bộ bình luận của đợt review tập trung (Feedback View)' })
  async getAllReviewComments(
    @Param('id') id: string,
    @Query('revisionNumber') revisionNumber?: number,
  ) {
    const comments = await this.commentService.getAllReviewComments(
      id,
      revisionNumber ? Number(revisionNumber) : undefined,
    );
    return {
      success: true,
      data: comments,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/comments/:commentId/resolve')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Resolve hoặc Reopen bình luận/proposed change kèm ghi chú xử lý' })
  async resolveComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { isResolved: boolean; resolvedNote?: string },
  ) {
    const updated = await this.commentService.resolveComment(id, commentId, userId, dto);
    return {
      success: true,
      data: updated,
      message: dto.isResolved ? 'Góp ý đã được đánh dấu giải quyết' : 'Đã mở lại góp ý',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Xóa bình luận review' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.commentService.deleteComment(id, commentId, userId);
    return {
      success: true,
      message: 'Comment deleted successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/close-for-feedback')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Đóng nhận phản hồi review (QT-09)' })
  async closeForFeedback(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.executionService.closeForFeedback(id, userId);
    return {
      success: true,
      data: result,
      message: 'Review closed for feedback successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/reopen')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Mở lại nhận phản hồi review' })
  async reopenReview(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.executionService.reopenReview(id, userId);
    return {
      success: true,
      data: result,
      message: 'Review reopened successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/finalize')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Hoàn tất đợt review (Finalize review & Baseline) (QT-06)' })
  async finalizeReview(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.executionService.finalizeReview(id, userId);
    return {
      success: true,
      data: result,
      message: 'Review finalized successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/publish-revision')
  @UseGuards(ReviewParticipantGuard)
  @ApiOperation({ summary: 'Xuất bản revision mới cho review (QT-05)' })
  async publishRevision(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { changeDescription?: string; deadline?: string; notifyParticipants?: boolean },
  ) {
    const result = await this.executionService.publishRevision(id, userId, body);
    return {
      success: true,
      data: result,
      message: 'Revision published successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
