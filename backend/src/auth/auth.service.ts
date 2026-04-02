import type { StringValue } from 'ms';
import {
  Injectable, ConflictException, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../database/entities/user.entity';
import { RefreshToken } from '../database/entities/session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../database/enums/user-role.enum';
import { UserStatus } from '../database/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private sessionRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      role: UserRole.USER,
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
    });
    await this.userRepo.save(user);
    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto, ipAddress?: string, deviceInfo?: string) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.FROZEN) {
      throw new UnauthorizedException('Account suspended or frozen');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, refreshToken, ipAddress, deviceInfo);

    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async refresh(token: string) {
    const session = await this.sessionRepo.findOne({
      where: { token },
      relations: ['user'],
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(session.user);
    // Rotate token
    session.revokedAt = new Date();
    await this.sessionRepo.save(session);
    await this.storeRefreshToken(session.user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    const session = await this.sessionRepo.findOne({ where: { token } });
    if (session) {
      session.revokedAt = new Date();
      await this.sessionRepo.save(session);
    }
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRY', '15m') as StringValue,
    });
    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    deviceInfo?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const session = this.sessionRepo.create({
      userId,
      token,
      ipAddress: ipAddress ?? null,
      deviceInfo: deviceInfo ?? null,
      expiresAt,
    });
    await this.sessionRepo.save(session);
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, twoFactorSecret: _tfs, ...safe } = user;
    return safe;
  }
}
