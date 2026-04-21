import { v4 as uuidv4 } from 'uuid';

/**
 * UuidProvider is responsible for generating unique identifiers.
 * This prevents the application from being tightly coupled to a single library.
 */
export interface UuidProvider {
  /**
   * Generates a standard UUID v4 string.
   */
  generate(): string;
}

export class CryptoUuidProvider implements UuidProvider {
  generate(): string {
    return uuidv4();
  }
}
