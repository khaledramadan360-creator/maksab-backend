/**
 * Business Rules and Validation Constants
 */

export const Rules = {
  Invite: {
    EXPIRATION_HOURS: 24,
    SINGLE_USE: true,
  },
  PasswordReset: {
    EXPIRATION_MINUTES: 15,
    SINGLE_USE: true,
  },
  Validation: {
    Email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      transform: (val: string) => val.trim().toLowerCase(),
    },
    Password: {
      minLength: 8,
      maxLength: 72,
      regex: /^(?=.*[A-Za-z])(?=.*\d).+$/, // حرف ورقم على الأقل
    },
    FullName: {
      minLength: 2,
      maxLength: 100,
      required: true,
    }
  }
};
