import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LicenseGuard, RequireLicense } from '../../common/guards/license.guard';
import { ApiResponse, ItemSummary, LicenseType, PaginatedResult } from '@aljama/shared';

@ApiTags('Item Management')
@Controller()
@UseGuards(JwtAuthGuard, LicenseGuard)
@ApiBearerAuth()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get('projects/:projectId/items')
  @RequireLicense(LicenseType.FULL) // QT-08
  @ApiOperation({ summary: 'Get paginated items for List View (BR-NAV-05, BR-NAV-07)' })
  @SwaggerResponse({ status: 200, description: 'Paginated list of items returned' })
  async getProjectItems(
    @Param('projectId') projectId: string,
    @Query() query: QueryItemsDto,
  ): Promise<ApiResponse<PaginatedResult<ItemSummary>>> {
    const data = await this.itemService.getProjectItems(projectId, query);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('projects/:projectId/reading-view')
  @RequireLicense(LicenseType.FULL) // QT-08
  @ApiOperation({ summary: 'Get document-style sequential items for Reading View (BR-NAV-06)' })
  @SwaggerResponse({ status: 200, description: 'Reading view items returned' })
  async getReadingView(
    @Param('projectId') projectId: string,
    @Query('folderId') folderId?: string,
  ): Promise<ApiResponse<any[]>> {
    const data = await this.itemService.getReadingView(projectId, folderId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:id')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get single item details by ID' })
  @SwaggerResponse({ status: 200, description: 'Item details returned' })
  async getItemById(@Param('id') id: string): Promise<ApiResponse<ItemSummary>> {
    const data = await this.itemService.getItemById(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
