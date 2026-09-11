import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ScopeType, MentionedType } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async resolveMentions(
    content: string,
    explicitMentionedUserIds: string[] | undefined,
    authorId: string,
  ): Promise<string[]> {
    const extractedIds = new Set<string>(explicitMentionedUserIds || []);

    // 1. Match @username pattern (e.g. @admin, @alex.smith)
    const usernameRegex = /(?:^|\s)@([a-zA-Z0-9._-]+)/g;
    const usernames: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = usernameRegex.exec(content)) !== null) {
      usernames.push(match[1]);
    }

    if (usernames.length > 0) {
      const usersByUsername = await this.prisma.user.findMany({
        where: {
          username: { in: usernames, mode: 'insensitive' },
        },
        select: { id: true },
      });
      usersByUsername.forEach(u => extractedIds.add(u.id));
    }

    // 2. Fallback: match plain UUIDs in content
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const uuidMatches = content.match(uuidRegex) || [];
    uuidMatches.forEach(id => extractedIds.add(id));

    // 3. Filter out self-mentions
    const candidateIds = Array.from(extractedIds).filter(id => id !== authorId);
    if (candidateIds.length === 0) {
      return [];
    }

    // 4. Verify candidate users exist in database
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true },
    });

    return existingUsers.map(u => u.id);
  }

  async create(itemId: string, dto: CreateCommentDto, userId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    });

    const validMentions = await this.resolveMentions(dto.content, dto.mentionedUserIds, userId);

    const result = await this.prisma.$transaction(async tx => {
      const comment = await tx.comment.create({
        data: {
          content: dto.content,
          authorId: userId,
          scopeType: ScopeType.ITEM,
          scopeId: itemId,
          parentCommentId: dto.parentCommentId,
        },
      });

      if (validMentions.length > 0) {
        const mentionData = validMentions.map(id => ({
          commentId: comment.id,
          mentionedType: MentionedType.USER,
          mentionedId: id,
        }));
        await tx.commentMention.createMany({ data: mentionData });
      }

      return comment;
    });

    // Emit events
    this.eventEmitter.emit('comment.created', {
      commentId: result.id,
      itemId,
      projectId: item.projectId,
      authorId: userId,
    });

    for (const mentionedId of validMentions) {
      this.eventEmitter.emit('comment.mentioned', {
        mentionedUserId: mentionedId,
        commentId: result.id,
        authorId: userId,
        authorName: author?.fullName || 'A team member',
        itemId,
        itemName: item.name,
        projectId: item.projectId,
        projectName: item.project?.name,
      });
    }

    return this.prisma.comment.findUnique({
      where: { id: result.id },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        mentions: true,
        parent: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, fullName: true } },
          },
        },
      },
    });
  }

  async createForProject(projectId: string, dto: CreateCommentDto, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    });

    const validMentions = await this.resolveMentions(dto.content, dto.mentionedUserIds, userId);

    const result = await this.prisma.$transaction(async tx => {
      const comment = await tx.comment.create({
        data: {
          content: dto.content,
          authorId: userId,
          scopeType: ScopeType.PROJECT,
          scopeId: projectId,
          parentCommentId: dto.parentCommentId,
        },
      });

      if (validMentions.length > 0) {
        const mentionData = validMentions.map(id => ({
          commentId: comment.id,
          mentionedType: MentionedType.USER,
          mentionedId: id,
        }));
        await tx.commentMention.createMany({ data: mentionData });
      }

      return comment;
    });

    // Emit events
    this.eventEmitter.emit('comment.created', {
      commentId: result.id,
      projectId,
      authorId: userId,
    });

    for (const mentionedId of validMentions) {
      this.eventEmitter.emit('comment.mentioned', {
        mentionedUserId: mentionedId,
        commentId: result.id,
        authorId: userId,
        authorName: author?.fullName || 'A team member',
        projectId,
        projectName: project.name,
      });
    }

    return this.prisma.comment.findUnique({
      where: { id: result.id },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        mentions: true,
        parent: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, fullName: true } },
          },
        },
      },
    });
  }

  async findByItem(itemId: string) {
    return this.prisma.comment.findMany({
      where: {
        scopeType: ScopeType.ITEM,
        scopeId: itemId,
        isDeleted: false,
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        mentions: true,
        parent: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByProject(projectId: string) {
    const items = await this.prisma.item.findMany({
      where: { projectId, isDeleted: false },
      select: { id: true, name: true, itemKey: true },
    });
    const itemMap = new Map(items.map(i => [i.id, i]));
    const itemIds = items.map(i => i.id);

    const comments = await this.prisma.comment.findMany({
      where: {
        isDeleted: false,
        OR: [
          { scopeType: ScopeType.PROJECT, scopeId: projectId },
          { scopeType: ScopeType.ITEM, scopeId: { in: itemIds } },
        ],
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        mentions: true,
        parent: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map(c => {
      const itemInfo = c.scopeType === ScopeType.ITEM && c.scopeId ? itemMap.get(c.scopeId) : null;
      return {
        ...c,
        item: itemInfo ? { id: itemInfo.id, name: itemInfo.name, itemKey: itemInfo.itemKey } : null,
      };
    });
  }
}
