import { Router } from 'express';
import { ClientEmailCampaignsController } from './client-email-campaigns.controller';
import {
  getClientEmailCampaignDetailsSchema,
  getClientEmailCampaignRecipientEventsSchema,
  listClientEmailCampaignsSchema,
  previewClientEmailCampaignSchema,
  sendClientEmailCampaignSchema,
} from './client-email-campaigns.schemas';
import { validateRequest } from './client-email-campaigns.middleware';

export const createClientEmailCampaignsRoutes = (
  controller: ClientEmailCampaignsController,
  authenticate: ReturnType<
    typeof import('./client-email-campaigns.middleware').createClientEmailCampaignsAuthMiddleware
  >,
  authenticateWebhook: ReturnType<
    typeof import('./client-email-campaigns.middleware').createClientEmailCampaignsWebhookAuthMiddleware
  >
): Router => {
  const router = Router();

  router.post('/webhooks/brevo/marketing', authenticateWebhook, controller.marketingWebhook);

  router.use(authenticate);
  router.post('/preview', validateRequest(previewClientEmailCampaignSchema), controller.preview);
  router.post('/send', validateRequest(sendClientEmailCampaignSchema), controller.send);
  router.get('/', validateRequest(listClientEmailCampaignsSchema), controller.list);
  router.get('/:campaignId', validateRequest(getClientEmailCampaignDetailsSchema), controller.details);
  router.get(
    '/:campaignId/recipients/:recipientId/events',
    validateRequest(getClientEmailCampaignRecipientEventsSchema),
    controller.recipientEvents
  );

  return router;
};
