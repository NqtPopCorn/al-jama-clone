import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse, AuthTokens, UserSummary } from '@aljama/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/username and password' })
  @SwaggerResponse({ status: 200, description: 'User authenticated successfully' })
  @SwaggerResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<AuthTokens>> {
    const data = await this.authService.login(loginDto);
    return {
      success: true,
      data,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @SwaggerResponse({ status: 200, description: 'Current user profile returned' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') userId: string): Promise<ApiResponse<UserSummary>> {
    const data = await this.authService.getProfile(userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
