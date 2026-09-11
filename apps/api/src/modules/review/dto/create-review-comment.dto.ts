import { IsEnum, IsOptional, IsString, IsUUID, MinLength, IsArray } from 'class-validator';
import { ReviewCommentLabel } from '@prisma/client';

export class CreateReviewCommentDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsEnum(ReviewCommentLabel)
  label?: ReviewCommentLabel;

  @IsOptional()
  @IsString()
  selectedText?: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}
