import { IsArray, IsUUID, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkUpdateItemsDto {
  @ApiProperty({ description: 'Array of item UUIDs to update', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  itemIds: string[];

  @ApiPropertyOptional({ description: 'Priority level to apply to all selected items' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Workflow status to apply to all selected items' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Assignee UUID to apply to all selected items' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Folder UUID to move selected items into' })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
