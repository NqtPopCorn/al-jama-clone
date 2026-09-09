import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, LicenseType, UserStatus, UserSummary } from '@aljama/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(login: string, pass: string) {
    const isEmail = login.includes('@');
    const user = isEmail
      ? await this.userService.findByEmail(login)
      : await this.userService.findByUsername(login);

    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is currently deactivated');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.login, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email/username or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      licenseType: user.licenseType,
    };

    const accessToken = this.jwtService.sign(payload);

    const userSummary: UserSummary = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      licenseType: user.licenseType as unknown as LicenseType,
      status: user.status as unknown as UserStatus,
    };

    return {
      accessToken,
      user: userSummary,
    };
  }

  async getProfile(userId: string): Promise<UserSummary> {
    const user = await this.userService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      licenseType: user.licenseType as unknown as LicenseType,
      status: user.status as unknown as UserStatus,
    };
  }
}
