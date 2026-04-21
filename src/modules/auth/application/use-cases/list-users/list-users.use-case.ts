import { UserRepository, UserListFilters, PaginatedResult } from '../../../domain/repositories';
import { AuthApplicationMapper } from '../../mappers';
import { PublicUserDto } from '../../../public/auth.types';
import { AuthorizationError } from '../../errors';
import { Role } from '../../../domain/enums';

export interface ListUsersInput {
  actorUserId: string;
  page?: number;
  pageSize?: number;
  role?: Role;
  status?: string;
  email?: string;
}

export interface ListUsersOutput {
  items: PublicUserDto[];
  total: number;
  page: number;
  pageSize: number;
}

const ALLOWED_ROLES: Role[] = [Role.Admin, Role.Manager];

export class ListUsersUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ListUsersInput): Promise<ListUsersOutput> {
    // Authorization: only admin and manager can list users
    const actor = await this.userRepo.findById(input.actorUserId);
    if (!actor || !ALLOWED_ROLES.includes(actor.role)) {
      throw new AuthorizationError('You do not have permission to list users');
    }

    const page     = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));

    const filters: UserListFilters = {};
    if (input.role)   filters.role   = input.role;
    if (input.status) filters.status = input.status as any;
    if (input.email)  filters.email  = input.email;

    const result = await this.userRepo.list(filters, { page, pageSize });

    return {
      items: result.items.map(AuthApplicationMapper.toPublicUserDto),
      total: result.total,
      page:  result.page,
      pageSize: result.pageSize,
    };
  }
}
