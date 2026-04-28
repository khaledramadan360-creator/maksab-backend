import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { EmailSuppression } from '../../domain/entities';
import { EligibilityReason, SuppressionLevel } from '../../domain/enums';
import { EmailSuppressionRepository } from '../../domain/repositories';
import { EmailSuppressionModel } from '../persistence/models/email-suppression.model';
import { ClientEmailCampaignMapper } from '../mappers/client-email-campaign.mapper';

export class MySQLEmailSuppressionRepository implements EmailSuppressionRepository {
  async findByEmails(emails: string[]): Promise<EmailSuppression[]> {
    const uniqueEmails = Array.from(new Set(emails.filter(email => !!email)));
    if (uniqueEmails.length === 0) {
      return [];
    }

    const rows = await EmailSuppressionModel.findAll({
      where: { email: { [Op.in]: uniqueEmails } },
    });

    return rows.map(ClientEmailCampaignMapper.suppressionToDomain);
  }

  async createOrUpdate(
    email: string,
    reason: EligibilityReason | string,
    level: SuppressionLevel,
    source: string
  ): Promise<EmailSuppression> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    const existing = await EmailSuppressionModel.findOne({ where: { email: normalizedEmail } });

    if (existing) {
      await existing.update({
        reason,
        level,
        source,
        updatedAt: now,
      });
      return ClientEmailCampaignMapper.suppressionToDomain(existing);
    }

    const created = await EmailSuppressionModel.create({
      id: uuidv4(),
      email: normalizedEmail,
      reason,
      level,
      source,
      createdAt: now,
      updatedAt: now,
    });

    return ClientEmailCampaignMapper.suppressionToDomain(created);
  }
}
