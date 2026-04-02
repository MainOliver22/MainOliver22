import {
  Injectable,
  ConflictException,
  NotFoundException,
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
}
