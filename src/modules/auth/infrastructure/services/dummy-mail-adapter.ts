import { AuthMailAdapter } from '../../application/services/mail-adapter.interface';

/**
 * A dummy logger implementation suitable for local development/testing.
 */
export class DummyMailAdapter implements AuthMailAdapter {
  private get frontendUrl() { return process.env.APP_FRONTEND_URL ?? 'http://localhost:3000'; }
  private get inviteAcceptPath() { return process.env.APP_FRONTEND_INVITE_ACCEPT_PATH ?? '/accept-invite'; }
  private get resetPasswordPath() { return process.env.APP_FRONTEND_RESET_PASSWORD_PATH ?? '/reset-password'; }

  private buildFrontendActionUrl(path: string, token: string): string {
    const normalizedBase = this.frontendUrl.endsWith('/')
      ? this.frontendUrl
      : `${this.frontendUrl}/`;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const url = new URL(normalizedPath, normalizedBase);
    url.searchParams.set('token', token);
    return url.toString();
  }

  async sendInviteEmail(toEmail: string, token: string, role: string): Promise<void> {
    console.log(`[MAILER] Triggered sendInviteEmail to ${toEmail}`);
    console.log(`[MAILER] Role: ${role}`);
    console.log(`[MAILER] Mock Link: ${this.buildFrontendActionUrl(this.inviteAcceptPath, token)}\n`);
  }

  async sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    console.log(`[MAILER] Triggered sendPasswordResetEmail to ${toEmail}`);
    console.log(`[MAILER] Mock Link: ${this.buildFrontendActionUrl(this.resetPasswordPath, token)}\n`);
  }
}
