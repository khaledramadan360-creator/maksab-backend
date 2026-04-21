import { ReportRenderPayload, ReportTemplateDefinition } from '../../domain/entities';
import { ReportTemplateKey } from '../../domain/enums';
import {
  ReportPdfFilePayload,
  ReportPdfGeneratorContract,
  ReportRendererContract,
  ReportTemplateRepositoryContract,
} from '../../domain/repositories';
import { ProviderError, ValidationError } from '../errors';
import { ReportRenderPayloadBuilderService } from './report-render-payload-builder.service';

export interface OrchestratedReportOutput {
  payload: ReportRenderPayload;
  template: ReportTemplateDefinition;
  renderedHtml: string;
  pdf: ReportPdfFilePayload;
  fileName: string;
}

export class ClientReportOrchestratorService {
  constructor(
    private readonly payloadBuilder: ReportRenderPayloadBuilderService,
    private readonly templateProvider: ReportTemplateRepositoryContract,
    private readonly rendererProvider: ReportRendererContract,
    private readonly pdfProvider: ReportPdfGeneratorContract
  ) {}

  async execute(clientId: string): Promise<OrchestratedReportOutput> {
    const startedAt = Date.now();
    const payload = await this.payloadBuilder.buildForClient(clientId);
    console.info(`[REPORTS] payload_ready client=${clientId} elapsed_ms=${Date.now() - startedAt}`);

    const template = await this.templateProvider.getTemplateByKey(ReportTemplateKey.DefaultClientReport);
    if (!template) {
      throw new ValidationError('Report template not found');
    }
    console.info(`[REPORTS] template_ready client=${clientId} elapsed_ms=${Date.now() - startedAt}`);

    let renderedHtml: string;
    try {
      renderedHtml = await this.rendererProvider.renderHtml({
        template,
        payload,
      });
      console.info(
        `[REPORTS] html_ready client=${clientId} elapsed_ms=${Date.now() - startedAt} html_chars=${renderedHtml.length}`
      );
    } catch (error: any) {
      throw new ProviderError(`Report HTML rendering failed: ${error?.message || 'Unknown error'}`);
    }

    if (!renderedHtml || renderedHtml.trim() === '') {
      throw new ProviderError('Report HTML rendering failed: empty output');
    }

    let pdf: ReportPdfFilePayload;
    try {
      pdf = await this.pdfProvider.generatePdf({
        html: renderedHtml,
        css: template.cssTemplate,
      });
      console.info(
        `[REPORTS] pdf_ready client=${clientId} elapsed_ms=${Date.now() - startedAt} pdf_bytes=${pdf.data.length}`
      );
    } catch (error: any) {
      throw new ProviderError(`Report PDF generation failed: ${error?.message || 'Unknown error'}`);
    }

    if (!pdf?.data || pdf.data.length === 0) {
      throw new ProviderError('Report PDF generation failed: empty PDF output');
    }

    return {
      payload,
      template,
      renderedHtml,
      pdf,
      fileName: this.buildFileName(clientId),
    };
  }

  private buildFileName(clientId: string): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedClientId = String(clientId || 'client')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `client-report-${sanitizedClientId || 'client'}-${stamp}.pdf`;
  }
}
