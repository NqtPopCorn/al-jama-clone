import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReuseItemDto {
  @ApiPropertyOptional({ description: 'Target folder UUID for cloned item' })
  @IsOptional()
  @IsUUID()
  targetFolderId?: string;

  @ApiPropertyOptional({ description: 'Prefix for cloned item name', default: '[Copy] ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  namePrefix?: string = '[Copy] ';
}
