/**
 * Public Types for Auth Module
 * 
 * تستخدم الموديولات الأخرى هذه الأنواع للتواصل الآمن مع موديول الـ Auth،
 * دون التعرف على الـ Entity Database Model المعقد داخل الـ Domain.
 */

export interface PublicUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}
