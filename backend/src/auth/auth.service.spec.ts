import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/session.entity';
import { UserRole } from '../database/enums/user-role.enum';
import { UserStatus } from '../database/enums/user-status.enum';

jest.mock('bcrypt');

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockSessionRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-access-token'),
  verify: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn().mockReturnValue('15m'),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;
  let sessionRepo: ReturnType<typeof mockSessionRepo>;
  let jwtService: ReturnType<typeof mockJwtService>;

  const baseUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    phone: null,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockSessionRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    sessionRepo = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ─────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates a new user and returns success message', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      userRepo.create.mockReturnValue({ ...baseUser, email: 'new@user.com' });
      userRepo.save.mockResolvedValue({});

      const result = await service.register({
        email: 'new@user.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result.message).toMatch(/Registration successful/);
      expect(userRepo.save).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when email already registered', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens and user on successful login', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      sessionRepo.create.mockReturnValue({});
      sessionRepo.save.mockResolvedValue({});

      const result = await service.login({ email: 'test@example.com', password: 'pass' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('throws UnauthorizedException for unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for suspended account', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, status: UserStatus.SUSPENDED });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns requires2fa flag when 2FA is enabled', async () => {
      const userWith2fa = { ...baseUser, twoFactorEnabled: true, twoFactorSecret: 'secret' };
      userRepo.findOne.mockResolvedValue(userWith2fa);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'pass' });

      expect(result).toHaveProperty('requires2fa', true);
      expect(result).toHaveProperty('tempToken');
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('returns new tokens when valid refresh token provided', async () => {
      const session = {
        token: 'old-refresh',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: baseUser,
      };
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({});

      const result = await service.refresh('old-refresh');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException for revoked token', async () => {
      sessionRepo.findOne.mockResolvedValue({ revokedAt: new Date() });

      await expect(service.refresh('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when session not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes the session and returns success', async () => {
      const session = { token: 'refresh', revokedAt: null };
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({});

      const result = await service.logout('refresh');

      expect(result).toHaveProperty('message');
      expect(session.revokedAt).toBeInstanceOf(Date);
    });

    it('returns success even when session not found', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      const result = await service.logout('unknown');
      expect(result).toHaveProperty('message');
    });
  });

  // ── 2FA ───────────────────────────────────────────────────────────────────────

  describe('enable2fa', () => {
    it('generates a TOTP secret and returns otpauthUrl', async () => {
      userRepo.findOne.mockResolvedValue(baseUser);
      userRepo.save.mockResolvedValue({});

      const result = await service.enable2fa('user-1');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauthUrl');
      expect(typeof result.secret).toBe('string');
    });
  });

  describe('confirm2fa', () => {
    it('throws UnauthorizedException for invalid TOTP code', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, twoFactorSecret: 'JBSWY3DPEHPK3PXP' });

      // Use a clearly invalid token
      await expect(service.confirm2fa('user-1', '000000')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verify2faLogin', () => {
    it('throws UnauthorizedException for invalid temp token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.verify2faLogin('bad-token', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for token that is not a 2FA pending token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1', twoFaPending: false });

      await expect(service.verify2faLogin('token', '123456')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
