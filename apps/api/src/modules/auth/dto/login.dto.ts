import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@aljama.local', description: 'User email or username' })
  @IsNotEmpty({ message: 'Email or username is required' })
  @IsString()
  login: string;

  @ApiProperty({ example: 'Admin@123', description: 'User password' })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
