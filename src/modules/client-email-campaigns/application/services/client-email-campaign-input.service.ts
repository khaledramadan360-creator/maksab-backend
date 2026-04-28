import {
  CampaignTitle,
  EmailContent,
  EmailSubject,
  EmailAddress,
  OverrideReason,
  SenderName,
} from '../../domain/value-objects';

export interface NormalizedCampaignInput {
  title: string;
  subject: string;
  htmlContent: string | null;
  textContent: string | null;
  senderName: string;
  senderEmail: string;
  clientIds: string[];
}

export class ClientEmailCampaignInputService {
  normalize(input: {
    title: string;
    subject: string;
    htmlContent?: string | null;
    textContent?: string | null;
    senderName: string;
    senderEmail: string;
    clientIds: string[];
  }): NormalizedCampaignInput {
    const content = EmailContent.parse(input.htmlContent, input.textContent);

    return {
      title: CampaignTitle.parse(input.title),
      subject: EmailSubject.parse(input.subject),
      htmlContent: content.htmlContent,
      textContent: content.textContent,
      senderName: SenderName.parse(input.senderName),
      senderEmail: EmailAddress.parse(input.senderEmail).toString(),
      clientIds: Array.from(new Set(input.clientIds)),
    };
  }

  normalizeOverrideReason(rawReason: string | null | undefined): string {
    return OverrideReason.parse(rawReason);
  }
}
