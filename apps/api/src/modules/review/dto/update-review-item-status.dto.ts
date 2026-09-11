import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReviewItemStatusValue } from '@prisma/client';

export class UpdateReviewItemStatusDto {
  @IsEnum(ReviewItemStatusValue)
  status: ReviewItemStatusValue;

  @IsOptional()
  @IsString()
  rejectionComment?: string;
}
