import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TraceMatrixQueryDto {
  @ApiPropertyOptional({ description: 'Source Item Type UUID (e.g. Requirement)' })
  @IsOptional()
  @IsUUID()
  sourceTypeId?: string;

  @ApiPropertyOptional({ description: 'Target Item Type UUID (e.g. Test Case or Use Case)' })
  @IsOptional()
  @IsUUID()
  targetTypeId?: string;
}
