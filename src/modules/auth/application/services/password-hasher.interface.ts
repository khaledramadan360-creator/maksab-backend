/**
 * Abstracts the hashing and verification of plain text passwords.
 */
export interface PasswordHasher {
  /**
   * Generates a secure hash from a plain text password.
   * @param plainText The password to hash.
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compares a plain text password against a secure hash.
   * @param plainText The password entered by the user.
   * @param hashed The stored secure hash.
   * @returns true if they match, false otherwise.
   */
  verify(plainText: string, hashed: string): Promise<boolean>;
}
