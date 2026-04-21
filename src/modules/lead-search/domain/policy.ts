import { Role } from '../../auth/domain/enums';

const LEAD_SEARCH_EXECUTE_ROLES: Role[] = [
  Role.Admin,
  Role.Manager,
  Role.Employee,
];
const LEAD_SEARCH_EXECUTE_PERMISSION = 'lead-search.execute';

export const LeadSearchPolicy = {
  LEAD_SEARCH_EXECUTE_PERMISSION,
  LEAD_SEARCH_EXECUTE_ROLES,
  canExecute(role?: string): boolean {
    if (!role) return false;
    return LEAD_SEARCH_EXECUTE_ROLES.includes(role as Role);
  },
};
