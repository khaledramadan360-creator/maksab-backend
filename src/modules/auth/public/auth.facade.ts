import { PublicUserDto } from './auth.types';

/**
 * Public Facade Interface (auth.facade.ts)
 * 
 * تمثل الواجهة الوحيدة المسموح لباقي मوديولات النظام بالتفاعل عبرها مع موديول الـ Auth.
 * مساحتها ضيقة جداً (Minimal Surface Area) ولا تكشف الـ Implementation Detail.
 */
export interface IAuthFacade {
  /** استرجاع بيانات المستخدم العامة باستخدام رقم المعرف */
  getUserById(userId: string): Promise<PublicUserDto | null>;
  
  /** استرجاع بيانات المستخدم العامة باستخدام إيميله */
  getUserByEmail(email: string): Promise<PublicUserDto | null>;
  
  /** التحقق من أن حالة المستخدم "Active" (مفيدة لموديولات أخرى، كمنع الموقوفين من الأفعال) */
  ensureUserIsActive(userId: string): Promise<boolean>;
  
  /** طرد مستخدم وإنهاء جميع جلساته */
  revokeAllSessionsForUser(userId: string): Promise<void>;
}
