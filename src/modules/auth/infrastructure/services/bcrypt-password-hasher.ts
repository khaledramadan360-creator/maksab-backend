import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/services/password-hasher.interface';

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds: number;

  constructor(rounds: number = 10) {
    this.rounds = rounds;
  }

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.rounds);
  }

  async verify(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
