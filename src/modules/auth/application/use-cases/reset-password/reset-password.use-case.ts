import { UserRepository, PasswordResetRepository, SessionRepository, AuditLogRepository } from '../../../domain/repositories';
import { PasswordHasher } from '../../services/password-hasher.interface';
import { TokenGenerator } from '../../services/token-generator.interface';
import { TimeProvider } from '../../../../../core/providers/time.provider';
import { AuditAction } from '../../../domain/enums';
import { Rules } from '../../../domain/rules';
import { AuthenticationError, ValidationError } from '../../errors';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly resetRepo: PasswordResetRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGen: TokenGenerator,
    private readonly timeProvider: TimeProvider
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = this.tokenGen.hashToken(input.token);

    const resetRecord = await this.resetRepo.findByTokenHash(tokenHash);

    if (!resetRecord) {
      throw new AuthenticationError('Invalid reset token');
    }
    
    if (resetRecord.usedAt !== null) {
      throw new AuthenticationError('Reset token already used');
    }
    
    if (resetRecord.expiresAt < this.timeProvider.now()) {
      throw new AuthenticationError('Reset token has expired');
    }

    if (!Rules.Validation.Password.regex.test(input.newPassword) || input.newPassword.length < Rules.Validation.Password.minLength) {
      throw new ValidationError('Password does not meet required complexity');
    }

    const user = await this.userRepo.findById(resetRecord.userId);
    if (!user) {
      throw new AuthenticationError('Invalid reset token');
    }

    user.passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepo.save(user);

    await this.resetRepo.markAsUsed(resetRecord.id);
    await this.sessionRepo.revokeAllForUser(user.id);

    await this.auditRepo.create({
      actorUserId: user.id,
      action: AuditAction.AuthPasswordResetCompleted,
      entityType: 'user',
      entityId: user.id,
      metadata: { resetRecordId: resetRecord.id }
    });

    await this.auditRepo.create({
      actorUserId: user.id,
      action: AuditAction.SessionRevokedAll,
      entityType: 'user',
      entityId: user.id,
      metadata: { reason: 'password_reset' }
    });
  }
}
