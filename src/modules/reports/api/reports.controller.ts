import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ReportsFacade } from '../public/reports.facade';

export class ReportsController {
  constructor(private readonly facade: ReportsFacade) {}

  generateClientReport = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.generateClientReport({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });

    result.report.pdfUrl = this.resolveAbsolutePublicUrl(req, result.report.pdfUrl);
    res.status(200).json({ data: result });
  });

  getClientReport = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getClientReport({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client report not found',
        },
      });
      return;
    }

    result.report.pdfUrl = this.resolveAbsolutePublicUrl(req, result.report.pdfUrl);
    res.status(200).json({ data: result });
  });

  listReports = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as any;
    const generatedAtFrom =
      q.generatedAtFrom ?? q.dateFrom ?? q.fromDate ?? q.startDate ?? q.from;
    const generatedAtTo =
      q.generatedAtTo ?? q.dateTo ?? q.toDate ?? q.endDate ?? q.to;

    const result = await this.facade.listReports({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      keyword: q.keyword,
      ownerUserId: q.ownerUserId,
      status: q.status,
      generatedAtFrom,
      generatedAtTo,
      page: Number(q.page ?? 1),
      pageSize: Number(q.pageSize ?? 20),
    });

    res.status(200).json({ data: result });
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getReportById({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      reportId: req.params.reportId,
    });

    if (!result) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Report not found',
        },
      });
      return;
    }

    result.report.pdfUrl = this.resolveAbsolutePublicUrl(req, result.report.pdfUrl);
    res.status(200).json({ data: result });
  });

  deleteReport = asyncHandler(async (req: Request, res: Response) => {
    await this.facade.deleteClientReport({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      reportId: req.params.reportId,
    });

    res.status(204).send();
  });

  getWhatChimpPhoneNumberOptions = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.facade.getWhatChimpPhoneNumberOptions({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
    });

    res.status(200).json({ data: result });
  });

  sendReportToWhatChimp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      recipientPhone: string;
      recipientSource?: 'whatsapp' | 'mobile' | 'custom' | null;
      recipientName?: string | null;
      messageText?: string | null;
      whatchimpPhoneNumberId?: string | null;
    };

    const result = await this.facade.sendReportToWhatChimp({
      actorUserId: req.user!.userId,
      actorUserRole: req.user!.role,
      clientId: req.params.clientId,
      recipientPhone: body.recipientPhone,
      recipientSource: body.recipientSource,
      recipientName: body.recipientName,
      messageText: body.messageText,
      whatchimpPhoneNumberId: body.whatchimpPhoneNumberId,
    });

    res.status(200).json({
      success: result.success,
      message: 'Report archived to WhatChimp successfully.',
      data: result,
    });
  });

  private resolveAbsolutePublicUrl(req: Request, url: string | null): string | null {
    if (!url) {
      return null;
    }

    const trimmed = String(url).trim();
    if (!trimmed) {
      return null;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
    const host = forwardedHost || req.get('host') || '';
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    if (!host) {
      return normalizedPath;
    }

    return `${protocol}://${host}${normalizedPath}`;
  }
}
