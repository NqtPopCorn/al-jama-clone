import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReviewCommentDto } from '../dto/create-review-comment.dto';
import { ReviewStatus, ReviewCommentLabel } from '@prisma/client';

@Injectable()
export class ReviewCommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Lấy danh sách bình luận kèm luồng replies của 1 ReviewItem (BR-REV-12)
   */
  async getItemComments(reviewItemId: string, revisionNumber?: number) {
    const reviewItem = await this.prisma.reviewItem.findUnique({
      where: { id: reviewItemId },
      include: { review: true },
    });
    if (!reviewItem) {
      throw new NotFoundException(`Review item ${reviewItemId} not found`);
    }

    const rev = revisionNumber || reviewItem.review.currentRevisionNumber;

    const topLevelComments = await this.prisma.reviewComment.findMany({
      where: {
        reviewItemId,
        revisionNumber: rev,
        parentCommentId: null,
      },
      include: {
        author: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
        mentions: {
          select: {
            mentionedUserId: true,
          },
        },
        replies: {
          include: {
            author: {
              select: { id: true, fullName: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return topLevelComments;
  }

  /**
   * Tạo bình luận mới cho ReviewItem (hỗ trợ bôi đen selectedText và @mentions) (BR-REV-12, BR-REV-13, BR-REV-16)
   */
  async createComment(
    reviewId: string,
    reviewItemId: string,
    currentUserId: string,
    dto: CreateReviewCommentDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { items: true },
    });
    if (!review) throw new NotFoundException(`Review ${reviewId} not found`);

    if (
      review.status === ReviewStatus.CLOSED_FOR_FEEDBACK ||
      review.status === ReviewStatus.FINALIZED ||
      review.status === ReviewStatus.ARCHIVED
    ) {
      throw new ConflictException(`Cannot comment: Review is in ${review.status} state.`);
    }

    const reviewItem = review.items.find(i => i.id === reviewItemId);
    if (!reviewItem) {
      throw new NotFoundException(
        `ReviewItem ${reviewItemId} does not belong to review ${reviewId}`,
      );
    }

    const participant = await this.prisma.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: currentUserId } },
    });
    if (!participant) {
      throw new ForbiddenException('You must be a review participant to leave comments');
    }

    return this.prisma.$transaction(async tx => {
      const comment = await tx.reviewComment.create({
        data: {
          reviewItemId,
          parentCommentId: dto.parentCommentId || null,
          authorId: currentUserId,
          revisionNumber: review.currentRevisionNumber,
          label: dto.label || ReviewCommentLabel.GENERAL,
          content: dto.content.trim(),
          selectedText: dto.selectedText ? dto.selectedText.trim() : null,
        },
        include: {
          author: {
            select: { id: true, fullName: true, username: true, avatarUrl: true },
          },
        },
      });

      // Tạo mention records nếu có
      if (dto.mentionedUserIds && dto.mentionedUserIds.length > 0) {
        await tx.reviewCommentMention.createMany({
          data: dto.mentionedUserIds.map(userId => ({
            reviewCommentId: comment.id,
            mentionedUserId: userId,
          })),
          skipDuplicates: true,
        });

        // Bắn event notify users
        this.eventEmitter.emit('review.comment_mentioned', {
          reviewId,
          reviewItemId,
          commentId: comment.id,
          mentionedUserIds: dto.mentionedUserIds,
          authorId: currentUserId,
        });
      }

      this.eventEmitter.emit('review.comment_created', {
        reviewId,
        reviewItemId,
        commentId: comment.id,
        authorId: currentUserId,
      });

      return comment;
    });
  }
}
