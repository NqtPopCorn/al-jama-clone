import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectService } from '../project/project.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ItemRelationshipSummary,
  RelationshipTypeSummary,
  RelatedItemSummary,
  CreateRelationshipDto,
  ImpactAnalysisResult,
  ImpactAnalysisNode,
  TraceMatrixResult,
  TraceMatrixRow,
} from '@aljama/shared';
import { ItemActivityType } from '@prisma/client';
import {
  RelationshipCreatedEvent,
  RelationshipDeletedEvent,
  SuspectFlaggedEvent,
  SuspectClearedEvent,
} from './events/traceability-events';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectService: ProjectService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private mapRelatedItem(item: {
    id: string;
    itemKey: string;
    name: string;
    itemTypeId: string;
    itemType: { key: string; name: string; icon?: string | null };
    status?: string | null;
    priority?: string | null;
    currentVersion: number;
  }): RelatedItemSummary {
    return {
      id: item.id,
      itemKey: item.itemKey,
      name: item.name,
      itemTypeId: item.itemTypeId,
      itemTypeKey: item.itemType.key,
      itemTypeName: item.itemType.name,
      itemTypeIcon: item.itemType.icon,
      status: item.status,
      priority: item.priority,
      currentVersion: item.currentVersion,
    };
  }

  private mapRelationshipType(rt: {
    id: string;
    projectId?: string | null;
    name: string;
    inverseName: string;
    isRequiredDefault: boolean;
    suspectOnUpstreamChange: boolean;
  }): RelationshipTypeSummary {
    return {
      id: rt.id,
      projectId: rt.projectId,
      name: rt.name,
      inverseName: rt.inverseName,
      isRequiredDefault: rt.isRequiredDefault,
      suspectOnUpstreamChange: rt.suspectOnUpstreamChange,
    };
  }

  // ---------------------------------------------------------------------------
  // 1. Get Project Relationship Types
  // ---------------------------------------------------------------------------
  async getProjectRelationshipTypes(projectId: string): Promise<RelationshipTypeSummary[]> {
    if (!UUID_REGEX.test(projectId)) return [];
    const types = await this.prisma.relationshipType.findMany({
      where: {
        OR: [{ projectId }, { projectId: null }],
      },
      orderBy: { name: 'asc' },
    });
    return types.map(t => this.mapRelationshipType(t));
  }

  // ---------------------------------------------------------------------------
  // 2. Get Item Relationships (Both Upstream and Downstream)
  // ---------------------------------------------------------------------------
  async getItemRelationships(itemId: string): Promise<ItemRelationshipSummary[]> {
    if (!UUID_REGEX.test(itemId)) return [];

    const [upstreamLinks, downstreamLinks] = await Promise.all([
      // Upstream: item is downstreamItemId, related item is upstreamItemId
      this.prisma.itemRelationship.findMany({
        where: { downstreamItemId: itemId },
        include: {
          relationshipType: true,
          upstreamItem: {
            include: { itemType: true },
          },
          creator: { select: { id: true, fullName: true } },
          clearer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Downstream: item is upstreamItemId, related item is downstreamItemId
      this.prisma.itemRelationship.findMany({
        where: { upstreamItemId: itemId },
        include: {
          relationshipType: true,
          downstreamItem: {
            include: { itemType: true },
          },
          creator: { select: { id: true, fullName: true } },
          clearer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const results: ItemRelationshipSummary[] = [];

    // Map Upstream links
    for (const rel of upstreamLinks) {
      if (!rel.upstreamItem.isDeleted) {
        results.push({
          id: rel.id,
          projectId: rel.projectId,
          direction: 'upstream',
          relatedItem: this.mapRelatedItem(rel.upstreamItem),
          relationshipType: this.mapRelationshipType(rel.relationshipType),
          isSuspect: rel.isSuspect,
          suspectFlaggedAt: rel.suspectFlaggedAt?.toISOString() || null,
          suspectReason: rel.suspectReason,
          clearedBy: rel.clearer ? { id: rel.clearer.id, fullName: rel.clearer.fullName } : null,
          clearedAt: rel.clearedAt?.toISOString() || null,
          createdBy: { id: rel.creator.id, fullName: rel.creator.fullName },
          createdAt: rel.createdAt.toISOString(),
        });
      }
    }

    // Map Downstream links
    for (const rel of downstreamLinks) {
      if (!rel.downstreamItem.isDeleted) {
        results.push({
          id: rel.id,
          projectId: rel.projectId,
          direction: 'downstream',
          relatedItem: this.mapRelatedItem(rel.downstreamItem),
          relationshipType: this.mapRelationshipType(rel.relationshipType),
          isSuspect: rel.isSuspect,
          suspectFlaggedAt: rel.suspectFlaggedAt?.toISOString() || null,
          suspectReason: rel.suspectReason,
          clearedBy: rel.clearer ? { id: rel.clearer.id, fullName: rel.clearer.fullName } : null,
          clearedAt: rel.clearedAt?.toISOString() || null,
          createdBy: { id: rel.creator.id, fullName: rel.creator.fullName },
          createdAt: rel.createdAt.toISOString(),
        });
      }
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // 3. Create Relationship (BR-TRACE-01)
  // ---------------------------------------------------------------------------
  async createRelationship(
    projectId: string,
    dto: CreateRelationshipDto,
    userId: string,
  ): Promise<ItemRelationshipSummary> {
    if (dto.upstreamItemId === dto.downstreamItemId) {
      throw new BadRequestException('Cannot create a relationship between an item and itself');
    }

    // Check items exist and belong to the project
    const [upstreamItem, downstreamItem, relationshipType] = await Promise.all([
      this.prisma.item.findUnique({
        where: { id: dto.upstreamItemId },
        include: { itemType: true },
      }),
      this.prisma.item.findUnique({
        where: { id: dto.downstreamItemId },
        include: { itemType: true },
      }),
      this.prisma.relationshipType.findUnique({
        where: { id: dto.relationshipTypeId },
      }),
    ]);

    if (!upstreamItem || upstreamItem.isDeleted || upstreamItem.projectId !== projectId) {
      throw new NotFoundException('Upstream item not found in this project');
    }
    if (!downstreamItem || downstreamItem.isDeleted || downstreamItem.projectId !== projectId) {
      throw new NotFoundException('Downstream item not found in this project');
    }
    if (!relationshipType) {
      throw new NotFoundException('Relationship type not found');
    }

    // Check duplicate
    const existing = await this.prisma.itemRelationship.findUnique({
      where: {
        upstreamItemId_downstreamItemId_relationshipTypeId: {
          upstreamItemId: dto.upstreamItemId,
          downstreamItemId: dto.downstreamItemId,
          relationshipTypeId: dto.relationshipTypeId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('This relationship already exists');
    }

    const rel = await this.prisma.$transaction(async tx => {
      const createdRel = await tx.itemRelationship.create({
        data: {
          projectId,
          upstreamItemId: dto.upstreamItemId,
          downstreamItemId: dto.downstreamItemId,
          relationshipTypeId: dto.relationshipTypeId,
          createdBy: userId,
        },
        include: {
          relationshipType: true,
          creator: { select: { id: true, fullName: true } },
        },
      });

      // Activity logs
      await tx.itemActivityLog.createMany({
        data: [
          {
            itemId: dto.upstreamItemId,
            userId,
            activityType: ItemActivityType.EDITED,
            details: {
              action: 'RELATIONSHIP_ADDED',
              targetItemId: dto.downstreamItemId,
              targetItemKey: downstreamItem.itemKey,
              direction: 'downstream',
              relationshipType: relationshipType.name,
            },
          },
          {
            itemId: dto.downstreamItemId,
            userId,
            activityType: ItemActivityType.EDITED,
            details: {
              action: 'RELATIONSHIP_ADDED',
              targetItemId: dto.upstreamItemId,
              targetItemKey: upstreamItem.itemKey,
              direction: 'upstream',
              relationshipType: relationshipType.inverseName,
            },
          },
        ],
      });

      return createdRel;
    });

    this.eventEmitter.emit(
      'relationship.created',
      new RelationshipCreatedEvent(
        rel.id,
        projectId,
        dto.upstreamItemId,
        dto.downstreamItemId,
        userId,
      ),
    );

    return {
      id: rel.id,
      projectId: rel.projectId,
      direction: 'downstream',
      relatedItem: this.mapRelatedItem(downstreamItem),
      relationshipType: this.mapRelationshipType(rel.relationshipType),
      isSuspect: rel.isSuspect,
      suspectFlaggedAt: null,
      suspectReason: null,
      clearedBy: null,
      clearedAt: null,
      createdBy: { id: rel.creator.id, fullName: rel.creator.fullName },
      createdAt: rel.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Delete Relationship
  // ---------------------------------------------------------------------------
  async deleteRelationship(id: string, userId: string): Promise<{ success: boolean }> {
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException('Relationship not found');
    }

    const rel = await this.prisma.itemRelationship.findUnique({
      where: { id },
      include: {
        upstreamItem: { select: { id: true, itemKey: true } },
        downstreamItem: { select: { id: true, itemKey: true } },
        relationshipType: { select: { name: true } },
      },
    });

    if (!rel) {
      throw new NotFoundException('Relationship not found');
    }

    await this.prisma.$transaction(async tx => {
      await tx.itemRelationship.delete({ where: { id } });

      await tx.itemActivityLog.createMany({
        data: [
          {
            itemId: rel.upstreamItemId,
            userId,
            activityType: ItemActivityType.EDITED,
            details: {
              action: 'RELATIONSHIP_REMOVED',
              targetItemId: rel.downstreamItemId,
              targetItemKey: rel.downstreamItem.itemKey,
            },
          },
          {
            itemId: rel.downstreamItemId,
            userId,
            activityType: ItemActivityType.EDITED,
            details: {
              action: 'RELATIONSHIP_REMOVED',
              targetItemId: rel.upstreamItemId,
              targetItemKey: rel.upstreamItem.itemKey,
            },
          },
        ],
      });
    });

    this.eventEmitter.emit(
      'relationship.deleted',
      new RelationshipDeletedEvent(
        rel.id,
        rel.projectId,
        rel.upstreamItemId,
        rel.downstreamItemId,
        userId,
      ),
    );

    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // 5. Clear Suspect Flag (BR-TRACE-04)
  // ---------------------------------------------------------------------------
  async clearSuspect(relationshipId: string, userId: string): Promise<ItemRelationshipSummary> {
    if (!UUID_REGEX.test(relationshipId)) {
      throw new NotFoundException('Relationship not found');
    }

    const rel = await this.prisma.itemRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        relationshipType: true,
        downstreamItem: { include: { itemType: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });

    if (!rel) {
      throw new NotFoundException('Relationship not found');
    }

    const clearedAt = new Date();
    const updatedRel = await this.prisma.itemRelationship.update({
      where: { id: relationshipId },
      data: {
        isSuspect: false,
        clearedBy: userId,
        clearedAt,
      },
      include: {
        relationshipType: true,
        clearer: { select: { id: true, fullName: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });

    this.eventEmitter.emit(
      'relationship.suspect_cleared',
      new SuspectClearedEvent(rel.id, rel.downstreamItemId, userId),
    );

    return {
      id: updatedRel.id,
      projectId: updatedRel.projectId,
      direction: 'downstream',
      relatedItem: this.mapRelatedItem(rel.downstreamItem),
      relationshipType: this.mapRelationshipType(updatedRel.relationshipType),
      isSuspect: false,
      suspectFlaggedAt: updatedRel.suspectFlaggedAt?.toISOString() || null,
      suspectReason: updatedRel.suspectReason,
      clearedBy: updatedRel.clearer
        ? { id: updatedRel.clearer.id, fullName: updatedRel.clearer.fullName }
        : null,
      clearedAt: clearedAt.toISOString(),
      createdBy: { id: updatedRel.creator.id, fullName: updatedRel.creator.fullName },
      createdAt: updatedRel.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Clear All Suspects For Item
  // ---------------------------------------------------------------------------
  async clearAllSuspectsForItem(itemId: string, userId: string): Promise<{ clearedCount: number }> {
    if (!UUID_REGEX.test(itemId)) return { clearedCount: 0 };

    const result = await this.prisma.itemRelationship.updateMany({
      where: {
        downstreamItemId: itemId,
        isSuspect: true,
      },
      data: {
        isSuspect: false,
        clearedBy: userId,
        clearedAt: new Date(),
      },
    });

    return { clearedCount: result.count };
  }

  // ---------------------------------------------------------------------------
  // 7. QT-02: Trigger Suspect Flag On Upstream Change (Strictly 1 level downstream!)
  // ---------------------------------------------------------------------------
  async triggerSuspectFlagForUpstreamChange(
    upstreamItemId: string,
    changeComment?: string,
  ): Promise<number> {
    if (!UUID_REGEX.test(upstreamItemId)) return 0;

    // Find all relationships where upstream item is modified and relationshipType triggers suspect
    const relationships = await this.prisma.itemRelationship.findMany({
      where: {
        upstreamItemId,
        relationshipType: { suspectOnUpstreamChange: true },
        isSuspect: false,
      },
      select: { id: true, downstreamItemId: true },
    });

    if (relationships.length === 0) return 0;

    const now = new Date();
    const reason = changeComment
      ? `Upstream item changed: ${changeComment}`
      : 'Upstream item modified (new version published)';

    await this.prisma.itemRelationship.updateMany({
      where: {
        id: { in: relationships.map(r => r.id) },
      },
      data: {
        isSuspect: true,
        suspectFlaggedAt: now,
        suspectReason: reason,
        clearedBy: null,
        clearedAt: null,
      },
    });

    for (const r of relationships) {
      this.eventEmitter.emit(
        'relationship.suspect_flagged',
        new SuspectFlaggedEvent(r.id, r.downstreamItemId, upstreamItemId, reason),
      );
    }

    return relationships.length;
  }

  // ---------------------------------------------------------------------------
  // 8. Impact Analysis (BR-TRACE-05 BFS Traversal)
  // ---------------------------------------------------------------------------
  async getImpactAnalysis(
    itemId: string,
    upstreamDepth = 2,
    downstreamDepth = 2,
  ): Promise<ImpactAnalysisResult> {
    if (!UUID_REGEX.test(itemId)) {
      throw new NotFoundException('Item not found');
    }

    const root = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { itemType: true },
    });

    if (!root || root.isDeleted) {
      throw new NotFoundException('Item not found');
    }

    const rootSummary = this.mapRelatedItem(root);

    // BFS Upstream Traversal
    const upstreamNodes: ImpactAnalysisNode[] = [];
    const visitedUpstream = new Set<string>([itemId]);
    let currentUpstreamQueue = [{ id: itemId, depth: 0 }];
    let suspectCount = 0;
    const allImpactedIds = new Set<string>();

    while (currentUpstreamQueue.length > 0) {
      const nextQueue: Array<{ id: string; depth: number }> = [];

      for (const current of currentUpstreamQueue) {
        if (current.depth >= upstreamDepth) continue;

        const links = await this.prisma.itemRelationship.findMany({
          where: { downstreamItemId: current.id },
          include: {
            upstreamItem: { include: { itemType: true } },
            relationshipType: true,
          },
        });

        for (const link of links) {
          if (link.upstreamItem.isDeleted) continue;
          if (link.isSuspect) suspectCount++;
          allImpactedIds.add(link.upstreamItem.id);

          const node: ImpactAnalysisNode = {
            id: link.upstreamItem.id,
            itemKey: link.upstreamItem.itemKey,
            name: link.upstreamItem.name,
            itemTypeKey: link.upstreamItem.itemType.key,
            itemTypeName: link.upstreamItem.itemType.name,
            status: link.upstreamItem.status,
            depth: current.depth + 1,
            direction: 'upstream',
            relationshipPhrase: link.relationshipType.inverseName || link.relationshipType.name,
            isSuspect: link.isSuspect,
            suspectReason: link.suspectReason,
            children: [],
          };

          upstreamNodes.push(node);

          if (!visitedUpstream.has(link.upstreamItem.id)) {
            visitedUpstream.add(link.upstreamItem.id);
            nextQueue.push({ id: link.upstreamItem.id, depth: current.depth + 1 });
          }
        }
      }

      currentUpstreamQueue = nextQueue;
    }

    // BFS Downstream Traversal
    const downstreamNodes: ImpactAnalysisNode[] = [];
    const visitedDownstream = new Set<string>([itemId]);
    let currentDownstreamQueue = [{ id: itemId, depth: 0 }];

    while (currentDownstreamQueue.length > 0) {
      const nextQueue: Array<{ id: string; depth: number }> = [];

      for (const current of currentDownstreamQueue) {
        if (current.depth >= downstreamDepth) continue;

        const links = await this.prisma.itemRelationship.findMany({
          where: { upstreamItemId: current.id },
          include: {
            downstreamItem: { include: { itemType: true } },
            relationshipType: true,
          },
        });

        for (const link of links) {
          if (link.downstreamItem.isDeleted) continue;
          if (link.isSuspect) suspectCount++;
          allImpactedIds.add(link.downstreamItem.id);

          const node: ImpactAnalysisNode = {
            id: link.downstreamItem.id,
            itemKey: link.downstreamItem.itemKey,
            name: link.downstreamItem.name,
            itemTypeKey: link.downstreamItem.itemType.key,
            itemTypeName: link.downstreamItem.itemType.name,
            status: link.downstreamItem.status,
            depth: current.depth + 1,
            direction: 'downstream',
            relationshipPhrase: link.relationshipType.name,
            isSuspect: link.isSuspect,
            suspectReason: link.suspectReason,
            children: [],
          };

          downstreamNodes.push(node);

          if (!visitedDownstream.has(link.downstreamItem.id)) {
            visitedDownstream.add(link.downstreamItem.id);
            nextQueue.push({ id: link.downstreamItem.id, depth: current.depth + 1 });
          }
        }
      }

      currentDownstreamQueue = nextQueue;
    }

    return {
      rootItem: rootSummary,
      upstreamNodes,
      downstreamNodes,
      totalImpactedCount: allImpactedIds.size,
      suspectCount,
    };
  }

  // ---------------------------------------------------------------------------
  // 9. Trace Matrix View (BR-TRACE-06)
  // ---------------------------------------------------------------------------
  async getTraceMatrix(
    projectId: string,
    sourceTypeId?: string,
    targetTypeId?: string,
  ): Promise<TraceMatrixResult> {
    if (!UUID_REGEX.test(projectId)) {
      throw new NotFoundException('Project not found');
    }

    // Get project item types
    const itemTypes = await this.prisma.itemType.findMany({
      where: {
        OR: [{ projectId }, { projectId: null }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (itemTypes.length === 0) {
      throw new NotFoundException('No item types configured for this project');
    }

    const source = sourceTypeId
      ? itemTypes.find(t => t.id === sourceTypeId) || itemTypes[0]
      : itemTypes[0];

    const target = targetTypeId
      ? itemTypes.find(t => t.id === targetTypeId) || itemTypes[1] || itemTypes[0]
      : itemTypes[1] || itemTypes[0];

    // Query source items
    const sourceItems = await this.prisma.item.findMany({
      where: {
        projectId,
        itemTypeId: source.id,
        isDeleted: false,
      },
      include: {
        itemType: true,
        // When source is upstream and target is downstream
        upstreamRelationships: {
          where: {
            downstreamItem: {
              itemTypeId: target.id,
              isDeleted: false,
            },
          },
          include: {
            downstreamItem: { include: { itemType: true } },
            relationshipType: true,
          },
        },
        // When source is downstream and target is upstream
        downstreamRelationships: {
          where: {
            upstreamItem: {
              itemTypeId: target.id,
              isDeleted: false,
            },
          },
          include: {
            upstreamItem: { include: { itemType: true } },
            relationshipType: true,
          },
        },
      },
      orderBy: { itemKey: 'asc' },
    });

    let coveredCount = 0;
    const rows: TraceMatrixRow[] = [];

    for (const s of sourceItems) {
      // 1. Links where target is downstream (source is upstream)
      const downstreamLinked = s.upstreamRelationships.map(rel => ({
        relationshipId: rel.id,
        item: this.mapRelatedItem(rel.downstreamItem),
        relationshipTypeName: rel.relationshipType.inverseName, // e.g. "Verified by", "Satisfied by"
        direction: 'downstream' as const,
        isSuspect: rel.isSuspect,
        isRequired: rel.relationshipType.isRequiredDefault,
      }));

      // 2. Links where target is upstream (source is downstream)
      const upstreamLinked = s.downstreamRelationships.map(rel => ({
        relationshipId: rel.id,
        item: this.mapRelatedItem(rel.upstreamItem),
        relationshipTypeName: rel.relationshipType.name, // e.g. "Verifies", "Satisfies"
        direction: 'upstream' as const,
        isSuspect: rel.isSuspect,
        isRequired: rel.relationshipType.isRequiredDefault,
      }));

      const linked = [...downstreamLinked, ...upstreamLinked];
      const isCovered = linked.length > 0;
      if (isCovered) coveredCount++;

      rows.push({
        sourceItem: this.mapRelatedItem(s),
        linkedItems: linked,
        isCovered,
      });
    }

    const total = sourceItems.length;
    const coveragePercentage = total > 0 ? Math.round((coveredCount / total) * 100) : 0;

    return {
      sourceType: { id: source.id, key: source.key, name: source.name },
      targetType: { id: target.id, key: target.key, name: target.name },
      rows,
      totalSourceItems: total,
      coveredItemsCount: coveredCount,
      coveragePercentage,
    };
  }

  // ---------------------------------------------------------------------------
  // 10. Export Trace Matrix CSV (BR-TRACE-06)
  // ---------------------------------------------------------------------------
  async exportTraceMatrixCsv(
    projectId: string,
    sourceTypeId?: string,
    targetTypeId?: string,
  ): Promise<string> {
    const matrix = await this.getTraceMatrix(projectId, sourceTypeId, targetTypeId);

    const escapeCsv = (str: unknown) => {
      const text = String(str ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = [
      'Source Key',
      'Source Name',
      'Source Status',
      'Relationship',
      'Target Key',
      'Target Name',
      'Target Type',
      'Suspect Flag',
      'Is Required',
      'Coverage',
    ].join(',');

    const lines: string[] = [header];

    for (const row of matrix.rows) {
      if (row.linkedItems.length === 0) {
        lines.push(
          [
            escapeCsv(row.sourceItem.itemKey),
            escapeCsv(row.sourceItem.name),
            escapeCsv(row.sourceItem.status || 'N/A'),
            escapeCsv('(None)'),
            escapeCsv(''),
            escapeCsv(''),
            escapeCsv(''),
            escapeCsv('No'),
            escapeCsv('No'),
            escapeCsv('Missing Link'),
          ].join(','),
        );
      } else {
        for (const linked of row.linkedItems) {
          lines.push(
            [
              escapeCsv(row.sourceItem.itemKey),
              escapeCsv(row.sourceItem.name),
              escapeCsv(row.sourceItem.status || 'N/A'),
              escapeCsv(linked.relationshipTypeName),
              escapeCsv(linked.item.itemKey),
              escapeCsv(linked.item.name),
              escapeCsv(linked.item.itemTypeName),
              escapeCsv(linked.isSuspect ? 'SUSPECT (⚡)' : 'Clean'),
              escapeCsv(linked.isRequired ? 'Yes (Solid)' : 'No (Dashed)'),
              escapeCsv('Covered'),
            ].join(','),
          );
        }
      }
    }

    return lines.join('\r\n');
  }
}
