import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ description: 'Folder name', maxLength: 255, example: 'Functional Requirements' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Parent folder UUID (optional, null for top-level folder)',
    example: 'd8c4e0b0-3f4a-4b9d-a4f6-8c4d2e0f1a2b',
  })
  @IsOptional()
  @IsUUID()
  parentFolderId?: string | null;

  @ApiPropertyOptional({
    description: 'Order index within parent hierarchy',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
