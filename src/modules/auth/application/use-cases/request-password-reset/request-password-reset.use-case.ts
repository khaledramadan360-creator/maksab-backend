import { UserRepository, PasswordResetRepository, AuditLogRepository } from '../../../domain/repositories';
import { TokenGenerator } from '../../services/token-generator.interface';
import { AuthMailAdapter } from '../../services/mail-adapter.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { AuditAction, UserStatus } from '../../../domain/enums';
import { Rules } from '../../../domain/rules';

export interface RequestPasswordResetInput {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly resetRepo: PasswordResetRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly tokenGen: TokenGenerator,
    private readonly mailer: AuthMailAdapter,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const maskedEmail = this.maskEmail(email);
    console.log('[AUTH][RESET] Password reset requested', { email: maskedEmail });
    const user = await this.userRepo.findByEmail(email);

    if (!user || user.status !== UserStatus.Active) {
      console.warn('[AUTH][RESET] Reset email skipped (user not found or inactive)', {
        email: maskedEmail,
      });
      return;
    }

    const rawToken = this.tokenGen.generateRawToken();
    const tokenHash = this.tokenGen.hashToken(rawToken);
    
    const expirationMs = Rules.PasswordReset.EXPIRATION_MINUTES * 60 * 1000;
    const expiresAt = this.timeProvider.nowPlusMilliseconds(expirationMs);

    const resetRecord = await this.resetRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    await this.auditRepo.create({
      actorUserId: user.id,
      action: AuditAction.AuthPasswordResetRequested,
      entityType: 'password_reset',
      entityId: resetRecord.id,
      metadata: { email }
    });

    console.log('[AUTH][RESET] Sending password reset email', {
      userId: user.id,
      resetId: resetRecord.id,
      email: maskedEmail,
    });
    await this.mailer.sendPasswordResetEmail(email, rawToken);
    console.log('[AUTH][RESET] Password reset email send completed', {
      resetId: resetRecord.id,
      email: maskedEmail,
    });
  }

  private maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 1) {
      return '***';
    }

    return email[0] + '***' + email.slice(atIndex - 1);
  }
}
