import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
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
   * Performs full ECDSA recovery using ethers.js: recovers the signing address
   * from the Ethereum personal-sign hash of the message and compares it to the
   * claimed address.  Marks the wallet as verified on success.
   */
  async verifyWallet(
    userId: string,
    address: string,
    message: string,
    signature: string,
  ): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({
      where: { userId, address },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user and address');
    }

    // Validate signature format: 65 bytes → 130 hex chars (with or without 0x prefix)
    const sigHex = signature.startsWith('0x') ? signature.slice(2) : signature;
    if (!/^[0-9a-fA-F]{130}$/.test(sigHex)) {
      throw new BadRequestException('Invalid signature format');
    }

    // Recover the signing address using Ethereum personal-sign (EIP-191)
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      throw new BadRequestException('Signature verification failed');
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new BadRequestException(
        'Signature does not match the claimed address',
      );
    }

    this.logger.log(
      `SIWE verification succeeded for address=${address} userId=${userId}`,
    );

    wallet.isVerified = true;
    return this.walletRepo.save(wallet);
  }
}
