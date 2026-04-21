/**
 * Abstracts the generation of random tokens and their hashing.
 * Used for Invite tokens and Password Reset tokens.
 */
export interface TokenGenerator {
  /**
   * Generates a random cryptographic string (the raw token).
   */
  generateRawToken(): string;

  /**
   * Computes a deterministic hash for a given raw token.
   * Useful to store only the hash in the database, while sending the raw token to the user.
   */
  hashToken(rawToken: string): string;
}
