import { ClientReportRepository } from '../../domain/repositories';
import { ListReportsQuery, ListReportsResult } from '../dto/reports.commands';
import { ClientReportOwnershipService } from '../services/client-report-ownership.service';

export class ListReportsUseCase {
  constructor(
    private readonly reportRepo: ClientReportRepository,
    private readonly ownershipService: ClientReportOwnershipService
  ) {}

  async execute(query: ListReportsQuery): Promise<ListReportsResult> {
    this.ownershipService.assertActorIdentity(query.actorUserId, query.actorUserRole);
    this.ownershipService.assertCanReadReport(query.actorUserRole);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 20));

    const ownerUserId = this.ownershipService.resolveOwnerFilter(
      query.actorUserRole,
      query.actorUserId,
      query.filters.ownerUserId
    );

    return this.reportRepo.list(
      {
        ...query.filters,
        ownerUserId,
      },
      {
        page,
        pageSize,
      }
    );
  }
}
