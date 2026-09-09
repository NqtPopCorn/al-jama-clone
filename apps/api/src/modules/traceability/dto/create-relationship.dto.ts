import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRelationshipDto {
  @ApiProperty({ description: 'Upstream item UUID (the prerequisite / source item)' })
  @IsUUID()
  @IsNotEmpty()
  upstreamItemId: string;

  @ApiProperty({ description: 'Downstream item UUID (the dependent / target item)' })
  @IsUUID()
  @IsNotEmpty()
  downstreamItemId: string;

  @ApiProperty({ description: 'Relationship type UUID' })
  @IsUUID()
  @IsNotEmpty()
  relationshipTypeId: string;
}
