import { UserRepository, InviteRepository, InviteListFilters, PaginatedResult } from '../../../domain/repositories';
import { AuthorizationError } from '../../errors';
import { Role, InviteStatus } from '../../../domain/enums';
import { Invite } from '../../../domain/entities';

export interface InviteDto {
  id: string;
  email: string;
  role: Role;
  status: InviteStatus;
  expiresAt: Date;
  invitedByUserId: string;
  createdAt: Date;
}

export interface ListInvitesInput {
  actorUserId: string;
  page?: number;
  pageSize?: number;
  status?: InviteStatus;
  role?: Role;
  email?: string;
}

export interface ListInvitesOutput {
  items: InviteDto[];
  total: number;
  page: number;
  pageSize: number;
}

const ALLOWED_ROLES: Role[] = [Role.Admin, Role.Manager];

function toInviteDto(invite: Invite): InviteDto {
  return {
    id:              invite.id,
    email:           invite.email,
    role:            invite.role,
    status:          invite.status,
    expiresAt:       invite.expiresAt,
    invitedByUserId: invite.invitedByUserId,
    createdAt:       invite.createdAt,
  };
}

export class ListInvitesUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly inviteRepo: InviteRepository
  ) {}

  async execute(input: ListInvitesInput): Promise<ListInvitesOutput> {
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
      throw new AuthorizationError('You do not have permission to list invites');
    }

    const page     = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

    const filters: InviteListFilters = {};
    if (input.status) filters.status = input.status;
    if (input.role)   filters.role   = input.role;
    if (input.email)  filters.email  = input.email;

    const result = await this.inviteRepo.list(filters, { page, pageSize });

    return {
      items: result.items.map(toInviteDto),
      total: result.total,
      page:  result.page,
      pageSize: result.pageSize,
    };
  }
}
