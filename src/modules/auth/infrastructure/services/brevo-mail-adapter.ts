import * as nodemailer from 'nodemailer';
import { AuthMailAdapter } from '../../application/services/mail-adapter.interface';

/**
 * Production mail adapter using Brevo SMTP relay via Nodemailer.
 * Reads credentials from environment variables at first use (after dotenv loads).
 */
export class BrevoMailAdapter implements AuthMailAdapter {
  private _transporter: nodemailer.Transporter | null = null;

  private get transporter(): nodemailer.Transporter {
    if (!this._transporter) {
      this._transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false, // STARTTLS on port 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this._transporter;
  }

  private get fromName() { return process.env.SMTP_FROM_NAME ?? 'Mksab'; }
  private get fromEmail() { return process.env.MAIL_FROM_EMAIL ?? 'noreply@mksab.com'; }
  private get frontendUrl() { return process.env.APP_FRONTEND_URL ?? 'http://localhost:5173'; }
  private get inviteAcceptPath() { return process.env.APP_FRONTEND_INVITE_ACCEPT_PATH ?? '/accept-invite'; }
  private get resetPasswordPath() { return process.env.APP_FRONTEND_RESET_PASSWORD_PATH ?? '/reset-password'; }

  private get fromHeader() { return `"${this.fromName}" <${this.fromEmail}>`; }

  // ─── Invite Email ──────────────────────────────────────────────────────────
  async sendInviteEmail(toEmail: string, token: string, role: string): Promise<void> {
    const acceptUrl = this.buildFrontendActionUrl(this.inviteAcceptPath, token);
    const roleName = this.translateRole(role);

    try {
      await this.transporter.sendMail({
        from: this.fromHeader,
        to: toEmail,
        subject: 'دعوة للانضمام إلى منصة مكسب',
        html: this.buildInviteHtml(acceptUrl, roleName),
      });
      console.log(`[MAILER] ✅ Invite email sent to ${toEmail}`);
    } catch (err: any) {
      console.error(`[MAILER] ❌ Failed to send invite email to ${toEmail}:`, err?.message ?? err);
    }
  }

  // ─── Password Reset Email ──────────────────────────────────────────────────
  async sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    const resetUrl = this.buildFrontendActionUrl(this.resetPasswordPath, token);

    try {
      await this.transporter.sendMail({
        from: this.fromHeader,
        to: toEmail,
        subject: 'إعادة تعيين كلمة المرور — مكسب',
        html: this.buildResetHtml(resetUrl),
      });
      console.log(`[MAILER] ✅ Password reset email sent to ${toEmail}`);
    } catch (err: any) {
      console.error(`[MAILER] ❌ Failed to send reset email to ${toEmail}:`, err?.message ?? err);
    }
  }

  // ─── HTML Templates ────────────────────────────────────────────────────────
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
}
