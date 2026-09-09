import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name / title', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name: string;

  @ApiProperty({ description: 'Item type UUID' })
  @IsUUID()
  @IsNotEmpty()
  itemTypeId: string;

  @ApiPropertyOptional({ description: 'Parent folder UUID' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Rich text description (HTML/Markdown)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Priority level (e.g. High, Medium, Low)' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Workflow status (e.g. Draft, In Review, Approved)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Assignee user UUID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Dynamic custom fields key-value dictionary' })
  @IsOptional()
  customFields?: Record<string, unknown>;
}
