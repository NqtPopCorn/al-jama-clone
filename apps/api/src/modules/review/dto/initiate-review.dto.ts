import { IsOptional, IsString, IsDateString } from 'class-validator';

export class InitiateReviewDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
