/**
 * Represents the claims stored inside the Access Token.
 */
export interface JwtPayload {
  userId: string;
  role: string;
  // Custom scope or extra metadata could be added here
}

/**
 * Service to handle JWT creation and verification.
 */
export interface JwtService {
  /**
   * Signs a payload into a JWT access token.
   * @param payload User identity information.
   * @returns Signed JWT string.
   */
  signAccessToken(payload: JwtPayload): string;

  /**
   * Verifies a JWT access token and extracts the payload.
   * @param token The JWT string.
   * @returns Decoded payload if valid.
   * @throws Error if invalid or expired.
   */
  verifyAccessToken(token: string): JwtPayload;
}
