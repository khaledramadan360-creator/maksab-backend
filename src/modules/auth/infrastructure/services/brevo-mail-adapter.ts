import { AuthMailAdapter } from '../../application/services/mail-adapter.interface';

/**
 * Production mail adapter for auth emails.
 * Uses Brevo Transactional HTTP API only.
 */
export class BrevoMailAdapter implements AuthMailAdapter {
  private _brevoConfigLogged = false;
  private _transportChoiceLogged = false;

  constructor() {
    console.log('[MAILER] BrevoMailAdapter initialized (auth emails via Brevo HTTP API, marketing key only)');
  }

  private get brevoApiKey() {
    return process.env.BREVO_MARKETING_API_KEY?.trim() || '';
  }
  private get brevoBaseUrl() {
    return (process.env.BREVO_MARKETING_BASE_URL?.trim() || 'https://api.brevo.com/v3').replace(
      /\/+$/g,
      ''
    );
  }
  private get brevoTimeoutMs() {
    return this.resolvePositiveInt(process.env.BREVO_MARKETING_TIMEOUT_MS, 30000);
  }

  private get fromName() { return process.env.MAIL_FROM_NAME ?? 'Mksab'; }
  private get fromEmail() { return process.env.MAIL_FROM_EMAIL ?? 'noreply@mksab.com'; }
  private get frontendUrl() { return process.env.APP_FRONTEND_URL ?? 'http://localhost:5173'; }
  private get inviteAcceptPath() { return process.env.APP_FRONTEND_INVITE_ACCEPT_PATH ?? '/accept-invite'; }
  private get resetPasswordPath() { return process.env.APP_FRONTEND_RESET_PASSWORD_PATH ?? '/reset-password'; }

  // ─── Invite Email ──────────────────────────────────────────────────────────
  async sendInviteEmail(toEmail: string, token: string, role: string): Promise<void> {
    const acceptUrl = this.buildFrontendActionUrl(this.inviteAcceptPath, token);
    const roleName = this.translateRole(role);
    const maskedTo = this.maskEmail(toEmail);
    console.log('[MAILER] Preparing invite email', {
      to: maskedTo,
      role,
      from: this.fromEmail,
      acceptUrlHost: this.safeUrlHost(acceptUrl),
    });

    await this.sendEmail({
      toEmail,
      maskedToEmail: maskedTo,
      subject: 'دعوة للانضمام إلى منصة مكسب',
      html: this.buildInviteHtml(acceptUrl, roleName),
      kind: 'invite',
    });
  }

  async sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    const resetUrl = this.buildFrontendActionUrl(this.resetPasswordPath, token);
    const maskedTo = this.maskEmail(toEmail);
    console.log('[MAILER] Preparing reset email', {
      to: maskedTo,
      from: this.fromEmail,
      resetUrlHost: this.safeUrlHost(resetUrl),
    });

    await this.sendEmail({
      toEmail,
      maskedToEmail: maskedTo,
      subject: 'إعادة تعيين كلمة المرور — مكسب',
      html: this.buildResetHtml(resetUrl),
      kind: 'password_reset',
    });
  }

  private async sendEmail(input: {
    toEmail: string;
    maskedToEmail: string;
    subject: string;
    html: string;
    kind: 'invite' | 'password_reset';
  }): Promise<void> {
    this.logEffectiveTransport();

    try {
      await this.sendViaBrevoApi(input);
    } catch (err: any) {
      console.error('[MAILER] Send failed', {
        mode: 'brevo_api',
        kind: input.kind,
        to: input.maskedToEmail,
        error: this.serializeMailError(err),
      });
      throw new Error('MAIL_SEND_FAILED');
    }
  }

  private logEffectiveTransport(): void {
    if (this._transportChoiceLogged) {
      return;
    }

    this._transportChoiceLogged = true;
    console.log('[MAILER] Effective auth mail transport', {
      effectiveMode: 'brevo_api',
      keySource: 'BREVO_MARKETING_API_KEY',
      brevoApiKeyConfigured: this.brevoApiKey !== '',
    });
  }

  private async sendViaBrevoApi(input: {
    toEmail: string;
    maskedToEmail: string;
    subject: string;
    html: string;
    kind: 'invite' | 'password_reset';
  }): Promise<void> {
    if (!this.brevoApiKey) {
      throw new Error('BREVO_MARKETING_API_KEY_MISSING');
    }
    this.logBrevoApiConfig();

    const payload = {
      sender: {
        name: this.fromName,
        email: this.fromEmail,
      },
      to: [
        {
          email: input.toEmail,
        },
      ],
      subject: input.subject,
      htmlContent: input.html,
      tags: ['auth', input.kind],
      headers: {
        'X-Mailin-custom': 'source:auth;kind:' + input.kind,
      },
    };

    const result = await this.requestBrevoApi('/smtp/email', payload);
    console.log('[MAILER] Email sent via Brevo API', {
      kind: input.kind,
      to: input.maskedToEmail,
      messageId: result?.messageId,
    });
  }

  private async requestBrevoApi(pathname: string, body: unknown): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.brevoTimeoutMs);

    try {
      const response = await fetch(this.brevoBaseUrl + pathname, {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const payload = await this.readResponsePayload(response);
      if (!response.ok) {
        const message = this.extractBrevoErrorMessage(payload) || ('HTTP_' + response.status);
        throw new Error('BREVO_API_REQUEST_FAILED:' + response.status + ':' + message);
      }

      return payload;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('BREVO_API_TIMEOUT');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readResponsePayload(response: Response): Promise<Record<string, unknown>> {
    if (response.status === 204) {
      return {};
    }

    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return { value: parsed };
    } catch {
      return { message: text };
    }
  }

  private extractBrevoErrorMessage(payload: Record<string, unknown>): string {
    const message = payload?.message ?? payload?.error ?? payload?.code;
    return message ? String(message) : '';
  }


  private buildInviteHtml(acceptUrl: string, role: string): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a2e;padding:28px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">مكسب</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1a1a2e;margin:0 0 16px;">أهلًا!</h2>
            <p style="color:#444;line-height:1.7;margin:0 0 12px;">
              لقد تمت دعوتك للانضمام إلى منصة <strong>مكسب</strong> بدور
              <strong style="color:#1a1a2e;">${role}</strong>.
            </p>
            <p style="color:#444;line-height:1.7;margin:0 0 32px;">
              اضغط على الزر أدناه لاستكمال تسجيل حسابك:
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="${acceptUrl}"
                 style="background:#e8b84b;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">
                قبول الدعوة
              </a>
            </td></tr></table>
            <p style="color:#999;font-size:13px;margin:32px 0 0;line-height:1.6;">
              هذا الرابط صالح لمدة 7 أيام فقط. إذا لم تطلب هذه الدعوة، يمكنك تجاهل هذا البريد.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#bbb;font-size:12px;margin:0;">© 2026 مكسب. جميع الحقوق محفوظة.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private buildResetHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a2e;padding:28px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">مكسب</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1a1a2e;margin:0 0 16px;">إعادة تعيين كلمة المرور</h2>
            <p style="color:#444;line-height:1.7;margin:0 0 12px;">
              تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك على <strong>مكسب</strong>.
            </p>
            <p style="color:#444;line-height:1.7;margin:0 0 32px;">
              اضغط على الزر أدناه لاختيار كلمة مرور جديدة:
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="${resetUrl}"
                 style="background:#e8b84b;color:#1a1a2e;text-decoration:none;padding:14px 36px;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">
                إعادة تعيين كلمة المرور
              </a>
            </td></tr></table>
            <p style="color:#999;font-size:13px;margin:32px 0 0;line-height:1.6;">
              هذا الرابط صالح لـ 30 دقيقة فقط. إذا لم تطلب هذا، تجاهل هذا البريد — حسابك بأمان.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="color:#bbb;font-size:12px;margin:0;">© 2026 مكسب. جميع الحقوق محفوظة.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private buildFrontendActionUrl(path: string, token: string): string {
    const normalizedBase = this.frontendUrl.endsWith('/')
      ? this.frontendUrl
      : `${this.frontendUrl}/`;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    const url = new URL(normalizedPath, normalizedBase);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private translateRole(role: string): string {
    const map: Record<string, string> = {
      admin: 'مدير عام',
      manager: 'مدير',
      employee: 'موظف',
      viewer: 'مشاهد',
    };
    return map[role.toLowerCase()] ?? role;
  }

  private logBrevoApiConfig(): void {
    if (this._brevoConfigLogged) {
      return;
    }

    this._brevoConfigLogged = true;
    console.log('[MAILER] Brevo API config snapshot', {
      transportMode: 'brevo_api',
      keySource: 'BREVO_MARKETING_API_KEY',
      apiKeyConfigured: this.brevoApiKey !== '',
      baseUrl: this.brevoBaseUrl,
      timeoutMs: this.brevoTimeoutMs,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  private serializeMailError(err: any): Record<string, unknown> {
    return {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      command: err?.command,
      responseCode: err?.responseCode,
      response: err?.response,
      errno: err?.errno,
      syscall: err?.syscall,
      address: err?.address,
      port: err?.port,
      stack: err?.stack,
    };
  }

  private maskEmail(email: string): string {
    const value = String(email || '').trim();
    const atIndex = value.indexOf('@');
    if (atIndex <= 1) {
      return '***';
    }

    const local = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);
    const localMasked = local[0] + '***' + local.slice(-1);
    return localMasked + '@' + domain;
  }

  private safeUrlHost(rawUrl: string): string {
    try {
      return new URL(rawUrl).host;
    } catch {
      return 'invalid_url';
    }
  }

  private resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

}
