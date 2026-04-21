import * as crypto from 'crypto';
import { TokenGenerator } from '../../application/services/token-generator.interface';

export class CryptoTokenGenerator implements TokenGenerator {
  generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }
}
