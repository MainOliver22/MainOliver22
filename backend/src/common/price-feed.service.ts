import * as https from 'https';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MOCK_USD_PRICES } from './mock-prices';

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const STABLE_SYMBOLS = new Set(['USD', 'USDT', 'USDC']);
const CACHE_TTL_MS = 60_000;

@Injectable()
export class PriceFeedService {
  private readonly logger = new Logger(PriceFeedService.name);
  private readonly binanceApiUrl: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly configService: ConfigService) {
    this.binanceApiUrl = this.configService.get<string>(
      'BINANCE_API_URL',
      'https://api.binance.com',
    );
  }

  async getPrice(symbol: string): Promise<number> {
    const upper = symbol.toUpperCase();

    if (STABLE_SYMBOLS.has(upper)) return 1;

    const cached = this.cache.get(upper);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.price;
    }

    try {
      const price = await this.fetchBinancePrice(upper);
      this.cache.set(upper, { price, fetchedAt: Date.now() });
      return price;
    } catch (err) {
      this.logger.error(
        `Failed to fetch price for ${upper} from Binance: ${(err as Error).message}. Using mock fallback.`,
      );
      return MOCK_USD_PRICES[upper] ?? 1;
    }
  }

  async getMockRate(from: string, to: string): Promise<number> {
    const [fromPrice, toPrice] = await Promise.all([
      this.getPrice(from),
      this.getPrice(to),
    ]);
    return fromPrice / toPrice;
  }

  private fetchBinancePrice(symbol: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = `${this.binanceApiUrl}/api/v3/ticker/price?symbol=${symbol}USDT`;
      https
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk: string) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data) as {
                price?: string;
                msg?: string;
              };
              if (parsed.price === undefined) {
                reject(new Error(parsed.msg ?? 'No price field in response'));
              } else {
                resolve(parseFloat(parsed.price));
              }
            } catch (e) {
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          });
        })
        .on('error', (e: unknown) =>
          reject(e instanceof Error ? e : new Error(String(e))),
        );
    });
  }
}
