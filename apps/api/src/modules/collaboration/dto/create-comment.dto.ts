import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  mentionedUserIds?: string[];
}
