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
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { TraceabilityService } from './traceability.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { ImpactAnalysisQueryDto } from './dto/impact-analysis-query.dto';
import { TraceMatrixQueryDto } from './dto/trace-matrix-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LicenseGuard, RequireLicense } from '../../common/guards/license.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponse,
  ItemRelationshipSummary,
  RelationshipTypeSummary,
  ImpactAnalysisResult,
  TraceMatrixResult,
  LicenseType,
} from '@aljama/shared';

@ApiTags('Traceability')
@Controller()
@UseGuards(JwtAuthGuard, LicenseGuard)
@ApiBearerAuth()
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('projects/:projectId/relationship-types')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get configured relationship types for a project' })
  @SwaggerResponse({ status: 200, description: 'List of relationship types returned' })
  async getProjectRelationshipTypes(
    @Param('projectId') projectId: string,
  ): Promise<ApiResponse<RelationshipTypeSummary[]>> {
    const data = await this.traceabilityService.getProjectRelationshipTypes(projectId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:itemId/relationships')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get all relationships (upstream & downstream) for an item' })
  @SwaggerResponse({ status: 200, description: 'Item relationships returned' })
  async getItemRelationships(
    @Param('itemId') itemId: string,
  ): Promise<ApiResponse<ItemRelationshipSummary[]>> {
    const data = await this.traceabilityService.getItemRelationships(itemId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('projects/:projectId/relationships')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Create a relationship between two items (BR-TRACE-01)' })
  @SwaggerResponse({ status: 201, description: 'Relationship created' })
  async createRelationship(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRelationshipDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemRelationshipSummary>> {
    const data = await this.traceabilityService.createRelationship(projectId, dto, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('relationships/:id')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Delete a relationship' })
  @SwaggerResponse({ status: 200, description: 'Relationship deleted' })
  async deleteRelationship(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.traceabilityService.deleteRelationship(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('relationships/:id/clear-suspect')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Clear suspect flag on a relationship (BR-TRACE-04)' })
  @SwaggerResponse({ status: 200, description: 'Suspect flag cleared' })
  async clearSuspect(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemRelationshipSummary>> {
    const data = await this.traceabilityService.clearSuspect(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('items/:itemId/clear-all-suspects')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Clear all suspect flags for an item' })
  @SwaggerResponse({ status: 200, description: 'All suspect flags cleared' })
  async clearAllSuspectsForItem(
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ clearedCount: number }>> {
    const data = await this.traceabilityService.clearAllSuspectsForItem(itemId, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:itemId/impact-analysis')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Perform BFS Impact Analysis graph traversal (BR-TRACE-05)' })
  @SwaggerResponse({ status: 200, description: 'Impact analysis graph returned' })
  async getImpactAnalysis(
    @Param('itemId') itemId: string,
    @Query() query: ImpactAnalysisQueryDto,
  ): Promise<ApiResponse<ImpactAnalysisResult>> {
    const data = await this.traceabilityService.getImpactAnalysis(
      itemId,
      query.upstreamDepth ?? 2,
      query.downstreamDepth ?? 2,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('projects/:projectId/trace-matrix')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get Traceability Matrix data (BR-TRACE-06)' })
  @SwaggerResponse({ status: 200, description: 'Trace matrix data returned' })
  async getTraceMatrix(
    @Param('projectId') projectId: string,
    @Query() query: TraceMatrixQueryDto,
  ): Promise<ApiResponse<TraceMatrixResult>> {
    const data = await this.traceabilityService.getTraceMatrix(
      projectId,
      query.sourceTypeId,
      query.targetTypeId,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('projects/:projectId/trace-matrix/export')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Export Trace Matrix as CSV (BR-TRACE-06)' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="trace-matrix.csv"')
  async exportTraceMatrixCsv(
    @Param('projectId') projectId: string,
    @Query() query: TraceMatrixQueryDto,
  ): Promise<string> {
    return this.traceabilityService.exportTraceMatrixCsv(
      projectId,
      query.sourceTypeId,
      query.targetTypeId,
    );
  }
}
