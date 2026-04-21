import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ClientsFacade } from '../public/clients.facade';

export class ClientsController {
  constructor(private readonly facade: ClientsFacade) {}

  createClient = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.createClient({
      ...req.body,
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });
    res.status(201).json({ data: result });
  });

  createClientFromSearch = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.createClientFromSearch({
      ...req.body,
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });
    res.status(201).json({ data: result });
  });

  listClients = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as any;
    const createdAtFrom =
      q.createdAtFrom ?? q.dateFrom ?? q.fromDate ?? q.startDate ?? q.from;
    const createdAtTo =
      q.createdAtTo ?? q.dateTo ?? q.toDate ?? q.endDate ?? q.to;

    const result = await this.facade.listClients({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      keyword: q.keyword,
      status: q.status,
      clientType: q.clientType,
      ownerUserId: q.ownerUserId,
      primaryPlatform: q.primaryPlatform,
      saudiCity: q.saudiCity,
      createdAtFrom,
      createdAtTo,
      includeArchived:
        typeof q.includeArchived === 'boolean'
          ? q.includeArchived
          : q.includeArchived === 'true'
            ? true
            : q.includeArchived === 'false'
              ? false
              : undefined,
      page: Number(q.page ?? 1),
      pageSize: Number(q.pageSize ?? 20),
    });
    res.status(200).json({ data: result });
  });

  listClientOwnerOptions = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as any;
    const result = await this.facade.listClientOwnerOptions({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      keyword: q.keyword,
      limit: q.limit !== undefined ? Number(q.limit) : undefined,
    });
    res.status(200).json({ data: result });
  });

  getClientById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getClientById({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
      return;
    }

    res.status(200).json({ data: result });
  });

  updateClient = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.updateClient({
      ...req.body,
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });
    res.status(200).json({ data: result });
  });

  changeClientStatus = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.changeClientStatus({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
      status: req.body.status,
    });
    res.status(200).json({ data: result });
  });

  changeClientOwner = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.changeClientOwner({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
      newOwnerUserId: req.body.newOwnerUserId,
    });
    res.status(200).json({ data: result });
  });

  deleteClient = asyncHandler(async (req: Request, res: Response) => {
    await this.facade.deleteClient({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });
    res.status(204).send();
  });

  getTeamOverview = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getTeamClientsOverview({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });
    res.status(200).json({ data: result });
  });
}
