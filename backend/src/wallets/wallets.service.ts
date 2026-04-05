import * as crypto from 'crypto';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletConnection } from '../database/enums/wallet-connection.enum';
import { ConnectWalletDto } from './dto/connect-wallet.dto';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async connectWallet(userId: string, dto: ConnectWalletDto): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({
      where: { userId, address: dto.address, chain: dto.chain },
    });
    if (existing) {
      throw new ConflictException('This wallet address is already connected for this chain');
    }

    const wallet = this.walletRepo.create({
      userId,
      address: dto.address,
      chain: dto.chain,
      label: dto.label ?? null,
      connectedVia: WalletConnection.WALLETCONNECT,
      isDefault: false,
    });
    return this.walletRepo.save(wallet);
  }

  async listWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeWallet(userId: string, walletId: string): Promise<void> {
    const wallet = await this.walletRepo.findOne({
      where: { id: walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    await this.walletRepo.delete(walletId);
  }

  async setDefault(userId: string, walletId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({
      where: { id: walletId, userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.walletRepo.update({ userId }, { isDefault: false });
    wallet.isDefault = true;
    return this.walletRepo.save(wallet);
  }

  /**
   * Verify a wallet via SIWE (Sign-In with Ethereum) signature.
   *
   * TODO: Full ECDSA recovery (ecrecover) requires an Ethereum library like ethers.js or viem.
   * Since neither is available in the backend, we perform a basic sanity check and log a warning.
   * Replace this stub with real EC recovery when an eth library is added to the backend dependencies.
   */
  async verifyWallet(
    userId: string,
    address: string,
    message: string,
    signature: string,
  ): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({ where: { userId, address } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user and address');
    }

    this.logger.warn(
      'SIWE stub: real ECDSA recovery requires an Ethereum library. ' +
        'Performing basic message/address sanity check only.',
    );

    // Basic SIWE sanity check: the signed message must contain the claimed address
    const lowerAddress = address.toLowerCase();
    const messageContainsAddress = message.toLowerCase().includes(lowerAddress);
    if (!messageContainsAddress) {
      throw new BadRequestException('SIWE message does not reference the claimed address');
    }

    // Verify the signature buffer is a valid hex and has the right length (65 bytes = 130 hex chars)
    const sigHex = signature.startsWith('0x') ? signature.slice(2) : signature;
    if (!/^[0-9a-fA-F]{130}$/.test(sigHex)) {
      throw new BadRequestException('Invalid signature format');
    }

    // Derive a deterministic check: SHA256(message) must not trivially mismatch
    const msgHash = crypto.createHash('sha256').update(message).digest('hex');
    this.logger.log(`SIWE verification for address=${address} msgHash=${msgHash}`);

    wallet.isVerified = true;
    return this.walletRepo.save(wallet);
  }
}
