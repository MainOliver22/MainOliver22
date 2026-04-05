/**
 * Single source of truth for mock USD prices used by both the exchange
 * and bots simulation services. All 10 platform assets are listed here.
 *
 * When integrating a real price feed, replace this map with live data
 * and update the two consumers (ExchangeService, BotsService).
 */
export const MOCK_USD_PRICES: Record<string, number> = {
  USD: 1,
  BTC: 40000,
  ETH: 2500,
  USDT: 1,
  USDC: 1,
  BNB: 320,
  SOL: 100,
  ADA: 0.5,
  XRP: 0.6,
  DOGE: 0.08,
};

/** Returns the cross-rate from → to using the shared USD price table. */
export function getMockRate(fromSymbol: string, toSymbol: string): number {
  const fromPrice = MOCK_USD_PRICES[fromSymbol.toUpperCase()] ?? 1;
  const toPrice = MOCK_USD_PRICES[toSymbol.toUpperCase()] ?? 1;
  return fromPrice / toPrice;
}
