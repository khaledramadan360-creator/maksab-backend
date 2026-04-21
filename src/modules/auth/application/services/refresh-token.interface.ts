export interface RefreshTokenPayload {
  rawToken: string;
  hashedToken: string;
  expiresAt: Date;
}

/**
 * Service dedicated to managing the refresh token secrets and expiry rules.
 */
export interface RefreshTokenService {
  /**
   * Generates a new raw and hashed pair for a refresh token, plus an expiration date.
   */
  generatePair(): RefreshTokenPayload;

  /**
   * Hashes a raw refresh token directly (usually for lookup purposes).
   */
  hashRawToken(rawToken: string): string;
}
