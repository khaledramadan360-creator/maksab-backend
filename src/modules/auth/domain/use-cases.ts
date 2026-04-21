/**
 * Use Case Interfaces List
 */

export interface IAuthUseCases {
  sendInvite(): Promise<void>;
  resendInvite(): Promise<void>;
  revokeInvite(): Promise<void>;
  validateInvite(): Promise<void>;
  acceptInvite(): Promise<void>;
  
  login(): Promise<void>;
  refreshSession(): Promise<void>;
  logout(): Promise<void>;
  
  requestPasswordReset(): Promise<void>;
  resetPassword(): Promise<void>;
  
  changeUserRole(): Promise<void>;
  suspendUser(): Promise<void>;
  reactivateUser(): Promise<void>;
  
  listUsers(): Promise<void>;
  listInvites(): Promise<void>;
  listAuditLogs(): Promise<void>;
}
