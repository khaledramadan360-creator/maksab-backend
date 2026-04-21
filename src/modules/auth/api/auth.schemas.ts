import { z } from 'zod';
import { Role, InviteStatus } from '../domain/enums';

// ─── Pagination helper ────────────────────────────────────────────────────────
const paginationSchema = {
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    fullName: z.string().min(2).max(100),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must contain at least one letter and one number'),
  })
});

export const sendInviteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.nativeEnum(Role),
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  })
});

export const validateTokenSchema = z.object({
  query: z.object({
    token: z.string().min(1),
  })
});

export const targetUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  })
});

export const targetInviteSchema = z.object({
  params: z.object({
    inviteId: z.string().uuid(),
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  })
});

export const changeRoleSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({ newRole: z.nativeEnum(Role) })
});

// ─── List / Query Schemas ─────────────────────────────────────────────────────
export const listUsersSchema = z.object({
  query: z.object({
    ...paginationSchema,
    role:   z.nativeEnum(Role).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    email:  z.string().optional(),
  })
});

export const listInvitesSchema = z.object({
  query: z.object({
    ...paginationSchema,
    status: z.nativeEnum(InviteStatus).optional(),
    role:   z.nativeEnum(Role).optional(),
    email:  z.string().optional(),
  })
});

export const listAuditLogsSchema = z.object({
  query: z.object({
    ...paginationSchema,
    action:            z.string().optional(),
    entityType:        z.string().optional(),
    actorUserIdFilter: z.string().uuid().optional(),
    dateFrom:          z.string().datetime({ offset: true }).optional(),
    dateTo:            z.string().datetime({ offset: true }).optional(),
  })
});
