# Frontend Report: Email Campaign Tracking API

## Scope

Reply tracking has been removed from the backend API.

The backend now supports only Brevo marketing events:

- delivered
- opened
- proxy_opened
- clicked
- soft_bounced
- hard_bounced
- unsubscribed
- complained

There is no reply timeline, no reply counters, and no reply configuration state in the API anymore.

## Removed From API

The frontend should remove all UI and logic related to:

- `replyToEmail`
- `replyTrackingEnabled`
- `repliedAt`
- `replyCount`
- `latestReplyText`
- `latestReplySubject`
- `latestReplyFromEmail`
- `repliedCount`
- recipient event details `replyText`
- recipient event details `replySubject`
- recipient event details `replyFromEmail`
- any filter, badge, card, or timeline item for `replied`

The inbound reply webhook endpoint was removed from the backend. Frontend does not need to reference reply-domain setup anymore.

## Active Backend Endpoints

### `POST /api/v1/client-email-campaigns/send`

Send response now contains:

```ts
{
  campaignId: string;
  status: 'sent' | 'partially_failed' | 'failed';
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  overrideCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  providerCampaignId: string | null;
  providerListId: string | null;
}
```

### `GET /api/v1/client-email-campaigns`

Campaign list item shape:

```ts
{
  id: string;
  title: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  status: 'draft' | 'previewed' | 'sending' | 'sent' | 'partially_failed' | 'failed';
  provider: 'brevo';
  providerCampaignId: string | null;
  providerListId: string | null;
  totalSelected: number;
  sendableCount: number;
  warningCount: number;
  blockedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  overrideCount: number;
  requestedByUserId: string;
  failureReason: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `GET /api/v1/client-email-campaigns/:campaignId`

Tracking summary shape:

```ts
{
  deliveredCount: number;
  openedCount: number;
  proxyOpenedCount: number;
  clickedCount: number;
  hardBouncedCount: number;
  softBouncedCount: number;
  unsubscribedCount: number;
  complainedCount: number;
  lastEventAt: string | null;
}
```

Recipient item shape:

```ts
{
  id: string;
  campaignId: string;
  clientId: string;
  email: string | null;
  name: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'blocked' | 'warning_not_selected';
  eligibilityLevel: 'sendable' | 'warning' | 'blocked';
  eligibilityReason: string | null;
  skipReason: string | null;
  overrideUsed: boolean;
  overrideReason: string | null;
  overrideByUserId: string | null;
  overrideAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  proxyOpenedAt: string | null;
  proxyOpenCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  clickCount: number;
  lastClickedUrl: string | null;
  bouncedAt: string | null;
  lastBounceType: 'hard_bounced' | 'soft_bounced' | null;
  unsubscribedAt: string | null;
  complainedAt: string | null;
  lastEventAt: string | null;
  lastEventType:
    | 'delivered'
    | 'opened'
    | 'proxy_opened'
    | 'clicked'
    | 'soft_bounced'
    | 'hard_bounced'
    | 'unsubscribed'
    | 'complained'
    | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `GET /api/v1/client-email-campaigns/:campaignId/recipients/:recipientId/events?page=1&pageSize=50`

Recipient event list now returns marketing-only events:

```ts
{
  recipient: ClientEmailCampaignRecipientDto;
  events: {
    items: Array<{
      id: string;
      campaignId: string;
      recipientId: string;
      clientId: string;
      source: 'marketing' | 'inbound';
      eventType:
        | 'delivered'
        | 'opened'
        | 'proxy_opened'
        | 'clicked'
        | 'soft_bounced'
        | 'hard_bounced'
        | 'unsubscribed'
        | 'complained';
      eventAt: string;
      linkUrl: string | null;
      reason: string | null;
      providerCampaignId: string | null;
      providerMessageId: string | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  };
}
```

Notes:

- Old reply events are filtered out from this endpoint.
- If old database rows still contain reply activity, the frontend should ignore it because it is no longer part of supported behavior.

## Frontend Changes Required

Remove these UI sections:

- reply status card
- reply filters
- reply columns
- reply timeline blocks
- reply setup warning

Keep these sections:

- delivery card
- open card
- proxy open card
- click card
- bounce cards
- unsubscribe card
- complaint card
- recipient event timeline for marketing events

## Operational Notes

Marketing tracking still depends on the Brevo marketing webhook reaching the deployed backend.

If the campaign sends but tracking stays zero, verify:

- the deployed backend URL is public and reachable
- Brevo marketing webhook points to `/api/v1/client-email-campaigns/webhooks/brevo/marketing`
- the webhook secret matches backend configuration if a secret is enabled
