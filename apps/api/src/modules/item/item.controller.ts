import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { ItemService } from './item.service';
import { QueryItemsDto } from './dto/query-items.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { BulkUpdateItemsDto } from './dto/bulk-update-items.dto';
import { ReuseItemDto } from './dto/reuse-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LicenseGuard, RequireLicense } from '../../common/guards/license.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiResponse,
  ItemDetail,
  ItemSummary,
  ItemVersionDiff,
  ItemVersionSummary,
  LicenseType,
  PaginatedResult,
} from '@aljama/shared';

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

  @Post('projects/:projectId/items')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({
    summary: 'Create new item with automatic key and version 1 (BR-ITEM-03, 04, 05)',
  })
  @SwaggerResponse({ status: 201, description: 'Item successfully created' })
  async createItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemDetail>> {
    const data = await this.itemService.createItem(projectId, dto, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('projects/:projectId/items/bulk')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Bulk update selected items (BR-ITEM-09)' })
  @SwaggerResponse({ status: 200, description: 'Items bulk updated' })
  async bulkUpdateItems(
    @Param('projectId') projectId: string,
    @Body() dto: BulkUpdateItemsDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ updatedCount: number; skippedLockedCount: number }>> {
    const data = await this.itemService.bulkUpdateItems(projectId, dto, userId);
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
  ): Promise<ApiResponse<unknown[]>> {
    const data = await this.itemService.getReadingView(projectId, folderId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:id')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get single item summary by ID' })
  @SwaggerResponse({ status: 200, description: 'Item summary returned' })
  async getItemById(@Param('id') id: string): Promise<ApiResponse<ItemSummary>> {
    const data = await this.itemService.getItemById(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:id/detail')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get full item detail with counts and subscription status' })
  @SwaggerResponse({ status: 200, description: 'Full item detail returned' })
  async getItemDetail(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemDetail>> {
    const data = await this.itemService.getItemDetail(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('items/:id')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Update item details and create new version snapshot (BR-ITEM-04, 06)' })
  @SwaggerResponse({ status: 200, description: 'Item updated successfully' })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemDetail>> {
    const data = await this.itemService.updateItem(id, dto, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items/:id/lock')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Acquire editing lock on item (QT-01)' })
  @SwaggerResponse({ status: 200, description: 'Lock acquired' })
  @SwaggerResponse({ status: 409, description: 'Item locked by another user' })
  async lockItem(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<unknown>> {
    const data = await this.itemService.lockItem(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items/:id/unlock')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Release lock on item (QT-01)' })
  @SwaggerResponse({ status: 200, description: 'Lock released' })
  async unlockItem(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<unknown>> {
    const data = await this.itemService.unlockItem(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:id/versions')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Get version history for item (BR-ITEM-07)' })
  @SwaggerResponse({ status: 200, description: 'List of item versions returned' })
  async getItemVersions(@Param('id') id: string): Promise<ApiResponse<ItemVersionSummary[]>> {
    const data = await this.itemService.getItemVersions(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items/:id/versions/compare')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({
    summary: 'Compare two item versions with word-level redline/greenline diff (BR-ITEM-07)',
  })
  @SwaggerResponse({ status: 200, description: 'Version diff comparison returned' })
  async compareVersions(
    @Param('id') id: string,
    @Query('v1', ParseIntPipe) v1: number,
    @Query('v2', ParseIntPipe) v2: number,
  ): Promise<ApiResponse<ItemVersionDiff>> {
    const data = await this.itemService.compareVersions(id, v1, v2);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items/:id/revert')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Make a previous version current (Image 5 Make Current)' })
  @SwaggerResponse({ status: 200, description: 'Reverted to target version' })
  async revertToVersion(
    @Param('id') id: string,
    @Query('version', ParseIntPipe) versionNumber: number,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemDetail>> {
    const data = await this.itemService.revertToVersion(id, versionNumber, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items/:id/subscribe')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Toggle subscription to item (BR-ITEM-08)' })
  @SwaggerResponse({ status: 200, description: 'Subscription toggled' })
  async toggleSubscription(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ isSubscribed: boolean }>> {
    const data = await this.itemService.toggleSubscription(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('items/:id/reuse')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Reuse / Clone existing item with new key (BR-ITEM-03)' })
  @SwaggerResponse({ status: 201, description: 'Item cloned successfully' })
  async reuseItem(
    @Param('id') id: string,
    @Body() dto: ReuseItemDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ItemDetail>> {
    const data = await this.itemService.reuseItem(id, dto, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('items/:id')
  @RequireLicense(LicenseType.FULL)
  @ApiOperation({ summary: 'Soft delete item' })
  @SwaggerResponse({ status: 200, description: 'Item deleted' })
  async deleteItem(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const data = await this.itemService.deleteItem(id, userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
