import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../database/entities/asset.entity';
import { AssetType } from '../database/enums/asset-type.enum';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async findAll(): Promise<Asset[]> {
    return this.assetRepo.find({
      where: { isActive: true },
      order: { symbol: 'ASC' },
    });
  }

  async findBySymbol(symbol: string): Promise<Asset | null> {
    return this.assetRepo.findOne({ where: { symbol, isActive: true } });
  }

  async findById(id: string): Promise<Asset | null> {
    return this.assetRepo.findOne({ where: { id, isActive: true } });
  }

  async seed(): Promise<void> {
    const count = await this.assetRepo.count();
    if (count > 0) return;

    const defaults: Partial<Asset>[] = [
      {
        symbol: 'USD',
        name: 'US Dollar',
        type: AssetType.FIAT,
        decimals: 2,
        chain: null,
        contractAddress: null,
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: AssetType.CRYPTO,
        chain: 'bitcoin',
        decimals: 8,
        contractAddress: null,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        type: AssetType.CRYPTO,
        chain: 'ethereum',
        decimals: 18,
        contractAddress: null,
      },
      {
        symbol: 'USDT',
        name: 'Tether',
        type: AssetType.CRYPTO,
        chain: 'ethereum',
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
      },
    ];

    for (const assetData of defaults) {
      const asset = this.assetRepo.create(assetData);
      await this.assetRepo.save(asset);
    }
  }
}
