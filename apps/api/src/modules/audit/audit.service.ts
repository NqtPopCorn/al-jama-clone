import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

export interface CreateAuditLogParams {
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          entityType: params.entityType,
          entityId: params.entityId,
          action: params.action,
          oldData: params.oldData ?? undefined,
          newData: params.newData ?? undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to record audit log: ${error.message}`, error.stack);
      // Audit log failures should not break primary transactions unless strictly required
      return null;
    }
  }

  async findLogs(query: QueryAuditLogDto) {
    const { entityType, entityId, userId, action, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
