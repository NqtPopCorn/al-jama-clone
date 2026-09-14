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
      include: {
        review: true,
        item: {
          select: { id: true, itemKey: true, name: true },
        },
      },
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
        resolver: {
          select: { id: true, fullName: true, username: true },
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

    return topLevelComments.map(c => ({
      id: c.id,
      reviewItemId: c.reviewItemId,
      itemKey: reviewItem.item?.itemKey || '',
      itemName: reviewItem.item?.name || '',
      parentCommentId: c.parentCommentId,
      authorId: c.authorId,
      authorName: c.author.fullName || c.author.username || 'User',
      authorAvatar: c.author.avatarUrl,
      revisionNumber: c.revisionNumber,
      label: c.label,
      content: c.content,
      selectedText: c.selectedText,
      isResolved: c.isResolved,
      resolvedNote: c.resolvedNote,
      resolvedBy: c.resolver?.fullName || c.resolver?.username || null,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      replies: c.replies.map(r => ({
        id: r.id,
        reviewItemId: r.reviewItemId,
        itemKey: reviewItem.item?.itemKey || '',
        itemName: reviewItem.item?.name || '',
        parentCommentId: r.parentCommentId,
        authorId: r.authorId,
        authorName: r.author.fullName || r.author.username || 'User',
        authorAvatar: r.author.avatarUrl,
        revisionNumber: r.revisionNumber,
        label: r.label,
        content: r.content,
        selectedText: r.selectedText,
        isResolved: r.isResolved,
        resolvedNote: r.resolvedNote,
        resolvedBy: null,
        resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
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

  /**
   * Lấy toàn bộ bình luận & phản hồi của cả đợt review tập trung cho Moderator (Feedback View)
   */
  async getAllReviewComments(reviewId: string, revisionNumber?: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        items: {
          include: {
            item: {
              select: { id: true, itemKey: true, name: true },
            },
          },
        },
      },
    });
    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    const rev = revisionNumber || review.currentRevisionNumber;

    const comments = await this.prisma.reviewComment.findMany({
      where: {
        reviewItem: {
          reviewId,
        },
        revisionNumber: rev,
        parentCommentId: null,
      },
      include: {
        reviewItem: {
          include: {
            item: {
              select: { id: true, itemKey: true, name: true },
            },
          },
        },
        author: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
        resolver: {
          select: { id: true, fullName: true, username: true },
        },
        mentions: {
          select: { mentionedUserId: true },
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

    return comments.map(c => ({
      id: c.id,
      reviewItemId: c.reviewItemId,
      itemKey: c.reviewItem?.item?.itemKey || '',
      itemName: c.reviewItem?.item?.name || '',
      parentCommentId: c.parentCommentId,
      authorId: c.authorId,
      authorName: c.author.fullName || c.author.username,
      authorAvatar: c.author.avatarUrl,
      revisionNumber: c.revisionNumber,
      label: c.label,
      content: c.content,
      selectedText: c.selectedText,
      isResolved: c.isResolved,
      resolvedNote: c.resolvedNote,
      resolvedBy: c.resolver?.fullName || c.resolver?.username || null,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      replies: c.replies.map(r => ({
        id: r.id,
        reviewItemId: r.reviewItemId,
        itemKey: c.reviewItem?.item?.itemKey || '',
        itemName: c.reviewItem?.item?.name || '',
        parentCommentId: r.parentCommentId,
        authorId: r.authorId,
        authorName: r.author.fullName || r.author.username,
        authorAvatar: r.author.avatarUrl,
        revisionNumber: r.revisionNumber,
        label: r.label,
        content: r.content,
        selectedText: r.selectedText,
        isResolved: r.isResolved,
        resolvedNote: r.resolvedNote,
        resolvedBy: null,
        resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
  }

  /**
   * Đánh dấu hoặc bỏ đánh dấu Resolve một bình luận/proposed change kèm ghi chú
   */
  async resolveComment(
    reviewId: string,
    commentId: string,
    userId: string,
    dto: { isResolved: boolean; resolvedNote?: string },
  ) {
    const comment = await this.prisma.reviewComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    const updated = await this.prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        isResolved: dto.isResolved,
        resolvedNote: dto.isResolved ? dto.resolvedNote || null : null,
        resolvedBy: dto.isResolved ? userId : null,
        resolvedAt: dto.isResolved ? new Date() : null,
      },
      include: {
        author: {
          select: { id: true, fullName: true, username: true, avatarUrl: true },
        },
        resolver: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    return updated;
  }

  /**
   * Xóa một bình luận
   */
  async deleteComment(reviewId: string, commentId: string, userId: string) {
    const comment = await this.prisma.reviewComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);

    await this.prisma.reviewComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }
}
