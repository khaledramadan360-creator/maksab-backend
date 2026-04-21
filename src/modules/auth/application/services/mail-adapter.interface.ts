/**
 * Abstracts communication for outgoing Emails (like invites and password resets).
 */
export interface AuthMailAdapter {
  /**
   * Sends an invitation link to a user.
   */
  sendInviteEmail(toEmail: string, token: string, role: string): Promise<void>;

  /**
   * Sends a password reset link to a user.
   */
  sendPasswordResetEmail(toEmail: string, token: string): Promise<void>;
}
