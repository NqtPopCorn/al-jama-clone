import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LicenseType, UserStatus } from '@aljama/shared';

describe('AuthService', () => {
  let service: AuthService;
  let userService: any;
  let jwtService: any;

  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'john_doe',
    email: 'john@example.com',
    fullName: 'John Doe',
    passwordHash: 'hashed_password',
    licenseType: LicenseType.FULL,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
  };

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user successfully by email', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('john@example.com', 'correct_password');

      expect(userService.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should validate user successfully by username', async () => {
      userService.findByUsername.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.validateUser('john_doe', 'correct_password');

      expect(userService.findByUsername).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'any');

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException if account is inactive/deactivated', async () => {
      userService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: UserStatus.INACTIVE,
      });

      await expect(
        service.validateUser('john@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return null if password does not match', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      const result = await service.validateUser('john@example.com', 'wrong_password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return accessToken and user summary on valid login', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);

      const result = await service.login({
        login: 'john@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('john@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
        }),
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ login: 'john@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
