import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewRole } from '@prisma/client';

export class CreateReviewParticipantDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsEnum(ReviewRole)
  reviewRole: ReviewRole;

  @IsOptional()
  @IsBoolean()
  isSigner?: boolean;
}

export class CreateReviewDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Review must include at least one item' })
  @IsUUID('4', { each: true })
  itemIds: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReviewParticipantDto)
  participants: CreateReviewParticipantDto[];

  @IsOptional()
  @IsBoolean()
  includeContext?: boolean;

  @IsOptional()
  @IsBoolean()
  initiateImmediately?: boolean;
}
