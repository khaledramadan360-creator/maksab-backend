import * as jwt from 'jsonwebtoken';
import { JwtPayload, JwtService } from '../../application/services/jwt.interface';

export class JsonWebTokenService implements JwtService {
  private readonly secret: string;
  private readonly expiresIn: string | number;

  constructor(secret: string, expiresIn: string | number = '15m') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret) as any;
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  }
}
