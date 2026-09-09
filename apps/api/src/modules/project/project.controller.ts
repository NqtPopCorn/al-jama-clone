import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LicenseGuard, RequireLicense } from '../../common/guards/license.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponse,
  ExplorerNode,
  FolderSummary,
  ItemTypeWithFields,
  LicenseType,
  ProjectMemberSummary,
  ProjectSummary,
} from '@aljama/shared';

@ApiTags('Projects & Navigation')
@Controller('projects')
@UseGuards(JwtAuthGuard, LicenseGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of projects for current user' })
  @SwaggerResponse({ status: 200, description: 'List of projects returned' })
  async getUserProjects(@CurrentUser('id') userId: string): Promise<ApiResponse<ProjectSummary[]>> {
    const data = await this.projectService.getUserProjects(userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details and dashboard stats (BR-NAV-03)' })
  @SwaggerResponse({ status: 200, description: 'Project details returned' })
  async getProjectById(
    @Param('id') projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.projectService.getProjectById(projectId, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/explorer-tree')
  @RequireLicense(LicenseType.FULL) // QT-08: Reviewer limited license blocked from Explorer
  @ApiOperation({ summary: 'Get hierarchical folder and item tree for Explorer (BR-NAV-04)' })
  @SwaggerResponse({ status: 200, description: 'Explorer tree returned' })
  @SwaggerResponse({ status: 403, description: 'Forbidden for Reviewer Limited license' })
  async getExplorerTree(
    @Param('id') projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ExplorerNode[]>> {
    const data = await this.projectService.getExplorerTree(projectId, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/item-types')
  @ApiOperation({ summary: 'Get item types configured for project with their custom fields' })
  @SwaggerResponse({ status: 200, description: 'Item types with fields returned' })
  async getItemTypes(@Param('id') projectId: string): Promise<ApiResponse<ItemTypeWithFields[]>> {
    const data = await this.projectService.getItemTypesWithFields(projectId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members of project for user picker / assignment' })
  @SwaggerResponse({ status: 200, description: 'Project members returned' })
  async getProjectMembers(
    @Param('id') projectId: string,
  ): Promise<ApiResponse<ProjectMemberSummary[]>> {
    const data = await this.projectService.getProjectMembers(projectId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/folders')
  @ApiOperation({ summary: 'Get flat list of folders in project' })
  @SwaggerResponse({ status: 200, description: 'Project folders returned' })
  async getProjectFolders(@Param('id') projectId: string): Promise<ApiResponse<FolderSummary[]>> {
    const data = await this.projectService.getProjectFolders(projectId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
