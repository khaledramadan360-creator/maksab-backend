import { Router } from 'express';
import { ClientEmailCampaignsController } from './client-email-campaigns.controller';
import {
  getClientEmailCampaignDetailsSchema,
  listClientEmailCampaignsSchema,
  previewClientEmailCampaignSchema,
  sendClientEmailCampaignSchema,
} from './client-email-campaigns.schemas';
import { validateRequest } from './client-email-campaigns.middleware';

export const createClientEmailCampaignsRoutes = (
  controller: ClientEmailCampaignsController,
  authenticate: ReturnType<
    typeof import('./client-email-campaigns.middleware').createClientEmailCampaignsAuthMiddleware
  >
): Router => {
  const router = Router();

  router.use(authenticate);
  router.post('/preview', validateRequest(previewClientEmailCampaignSchema), controller.preview);
  router.post('/send', validateRequest(sendClientEmailCampaignSchema), controller.send);
  router.get('/', validateRequest(listClientEmailCampaignsSchema), controller.list);
  router.get('/:campaignId', validateRequest(getClientEmailCampaignDetailsSchema), controller.details);

  return router;
};
