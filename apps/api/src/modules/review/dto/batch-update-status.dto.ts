import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ArrayMinSize } from 'class-validator';
import { ReviewItemStatusValue } from '@prisma/client';

export class BatchUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  reviewItemIds: string[];

  @IsEnum(ReviewItemStatusValue)
  status: ReviewItemStatusValue;

  @IsOptional()
  @IsString()
  rejectionComment?: string;
}
