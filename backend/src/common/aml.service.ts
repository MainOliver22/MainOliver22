import { Injectable, Logger } from '@nestjs/common';
import { AmlResultDto } from './dto/aml-result.dto';

/** A small representative set of OFAC/sanctions addresses for demo purposes. */
const SANCTIONED_ADDRESSES = new Set<string>([
  // OFAC-published Tornado Cash and related addresses (samples)
  '0x8589427373d6d84e98730d7795d8f6f8731fda16',
  '0x722122df12d4e14e13ac3b6895a86e84145b6967',
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b',
  '0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a',
  '0x7f367cc41522ce07553e823bf3be79a889debe1b',
  '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b',
  '0x901bb9583b24d97e995513c6778dc6888ab6870e',
  // BTC addresses (samples from OFAC SDN list)
  '12QtD5BFwRsdNsAZY76UVE1xyCGNTojH9h',
  '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH',
]);

/** Representative sanctioned name patterns (last name first or full name). */
const SANCTIONED_NAME_PATTERNS: RegExp[] = [
  /\bkim\s+jong\b/i,
  /\bsaddam\s+hussein\b/i,
  /\bmuammar\s+gaddafi\b/i,
  /\bosama\s+bin\s+laden\b/i,
  /\bputin\b/i,  // simplified demo pattern
];

@Injectable()
export class AmlService {
  private readonly logger = new Logger(AmlService.name);

  screenAddress(address: string | null): AmlResultDto {
    if (!address) {
      return { blocked: false };
    }

    const trimmed = address.trim();
    // EVM (0x…) addresses are case-insensitive hex — normalise to lowercase for comparison.
    // Bitcoin/non-EVM addresses use case-sensitive base58/bech32 encoding — preserve case.
    const normalised = trimmed.startsWith('0x') ? trimmed.toLowerCase() : trimmed;
    if (SANCTIONED_ADDRESSES.has(normalised)) {
      this.logger.warn(`AML: Blocked sanctioned address ${address}`);
      return { blocked: true, reason: 'Address appears on OFAC sanctions list' };
    }

    this.logger.debug(`AML: Address ${address} cleared`);
    return { blocked: false };
  }

  screenName(firstName: string, lastName: string): AmlResultDto {
    const fullName = `${firstName} ${lastName}`.trim();
    for (const pattern of SANCTIONED_NAME_PATTERNS) {
      if (pattern.test(fullName)) {
        this.logger.warn(`AML: Blocked sanctioned name "${fullName}"`);
        return { blocked: true, reason: 'Name matches OFAC sanctions list' };
      }
    }

    this.logger.debug(`AML: Name "${fullName}" cleared`);
    return { blocked: false };
  }
}
