import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImpactAnalysisQueryDto {
  @ApiPropertyOptional({ description: 'How many levels to traverse upstream (1-5)', default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  upstreamDepth?: number = 2;

  @ApiPropertyOptional({ description: 'How many levels to traverse downstream (1-5)', default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  downstreamDepth?: number = 2;
}
