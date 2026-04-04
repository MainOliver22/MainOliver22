import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../database/entities/wallet.entity';
import { WalletConnection } from '../database/enums/wallet-connection.enum';
import { ConnectWalletDto } from './dto/connect-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async connectWallet(userId: string, dto: ConnectWalletDto): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({
      where: { userId, address: dto.address, chain: dto.chain },
    });
    if (existing) {
      throw new ConflictException(
        'This wallet address is already connected for this chain',
      );
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
   * Real ECDSA signature recovery (ecrecover) requires an Ethereum library such as ethers.js or viem.
   * Until such a library is added to the backend dependencies, this endpoint rejects all verification
   * attempts to prevent false ownership claims.
   *
   * TODO: Replace the NotImplementedException below with actual ecrecover-based verification once
   *       ethers or viem is added to package.json.
   */
  async verifyWallet(
    userId: string,
    address: string,
    message: string,
    signature: string,
  ): Promise<Wallet> {
    // Suppress unused-parameter warnings — these will be used once real SIWE is implemented
    void message;
    void signature;

    const wallet = await this.walletRepo.findOne({
      where: { userId, address },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user and address');
    }

    // Real ECDSA signature verification is not yet implemented.
    // Reject instead of silently granting ownership to avoid security bypass.
    throw new BadRequestException(
      'SIWE signature verification is not yet implemented. ' +
        'Add ethers.js or viem to the backend and implement ecrecover-based verification.',
    );
  }
}
