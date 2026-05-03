# Frontend Report: WhatChimp Sender Resolution

## Summary

Backend now accepts a sender value from the frontend in `whatchimpPhoneNumberId`.

The frontend can send one of these values:

- `+966549483112`
- `+966115004605`
- `+966569038872`
- or any custom manual value

Backend behavior:

1. Receive `whatchimpPhoneNumberId` from frontend.
2. Try to resolve it to the correct internal WhatChimp account id.
3. Send the request to WhatChimp using the resolved internal account id.
4. Return both:
   - the effective sender value used
   - the resolved internal WhatChimp account id

This means the frontend no longer has to send a raw WhatChimp internal id directly.

Current backend mappings are enabled for:

- `+966549483112`
- `+966115004605`
- `+966569038872`

---

## Request Contract

### Endpoint

`POST /api/v1/clients/:clientId/report/send-whatchimp`

### Request Body

```json
{
  "recipientPhone": "+966500000000",
  "recipientSource": "whatsapp",
  "recipientName": "Client Name",
  "messageText": "Optional message",
  "whatchimpPhoneNumberId": "+966115004605"
}
```

### Important Note

`whatchimpPhoneNumberId` is now treated as a sender selector value from the frontend.

In practice, frontend may send:

- a real WhatChimp account id
- or a sender phone number such as `+966115004605`
- or a custom manual value

Backend will try to resolve it before calling WhatChimp.

---

## Resolution Rules

When backend receives `whatchimpPhoneNumberId`, it resolves it in this order:

1. If it matches a configured WhatChimp internal account id, use it directly.
2. If it matches a configured sender phone number, resolve it to the mapped internal account id.
3. If no value is sent, use the default configured account id.
4. If a custom value is sent and no mapping is found, backend passes it through as-is.

Implementation reference:

- [whatchimp-http.gateway.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/infrastructure/providers/whatchimp-http.gateway.ts:574)

---

## Response Contract

### Response Example

```json
{
  "success": true,
  "message": "Report archived to WhatChimp successfully.",
  "data": {
    "success": true,
    "status": "accepted",
    "attemptId": "uuid",
    "reportId": "uuid",
    "clientId": "uuid",
    "recipientPhone": "+966500000000",
    "recipientSource": "whatsapp",
    "provider": "whatchimp",
    "providerMessageId": "provider-message-id",
    "providerStatusCode": "200",
    "failureReason": null,
    "whatchimpPhoneNumberId": "+966115004605",
    "resolvedWhatChimpAccountId": "internal-provider-account-id",
    "createdAt": "2026-05-02T00:00:00.000Z"
  }
}
```

### Response Fields

- `whatchimpPhoneNumberId`
  - the effective sender value after backend resolution
- `resolvedWhatChimpAccountId`
  - the internal WhatChimp account id actually used in the provider request

Public DTO reference:

- [reports.types.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/public/reports.types.ts:145)

---

## Frontend Expectations

Frontend can keep its own dropdown values and send one of the three numbers directly.

Recommended frontend values:

- `maksab (+966549483112)` -> send `+966549483112`
- `maksab (+966115004605)` -> send `+966115004605`
- `Tadween (+966569038872)` -> send `+966569038872`
- custom input -> send the manual value as entered

The frontend does not need to convert these values into internal WhatChimp ids.

---

## Important Difference Between Fields

- `recipientPhone`
  - this is the customer phone number receiving the report

- `whatchimpPhoneNumberId`
  - this is the sender selector value coming from frontend
  - it may be a WhatChimp internal id
  - or a sender phone number

Frontend must not mix these two fields.

---

## Runtime Requirement

For sender phone numbers to resolve correctly, backend must have a mapping between:

- sender phone number
- WhatChimp internal account id

This mapping is configured through:

- `WHATCHIMP_PHONE_NUMBER_OPTIONS_JSON`

Example:

```json
[
  {
    "id": "internal-id-1",
    "name": "maksab",
    "phoneNumber": "+966549483112",
    "isDefault": true
  },
  {
    "id": "internal-id-2",
    "name": "maksab",
    "phoneNumber": "+966115004605"
  },
  {
    "id": "internal-id-3",
    "name": "Tadween",
    "phoneNumber": "+966569038872"
  }
]
```

Environment reference:

- [.env.example](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/.env.example:235)

---

## Error Scenario

If frontend sends `+966115004605` or `+966569038872` and backend has no mapping for that number, WhatChimp may reject the request with an error similar to:

`WhatsApp account not found`

So the frontend contract is ready, but production success for each number depends on backend configuration having the correct internal WhatChimp ids.

---

## Frontend Action Items

1. Keep sending one of the three sender numbers in `whatchimpPhoneNumberId`.
2. Do not send internal WhatChimp ids unless frontend already has them intentionally.
3. Continue sending `recipientPhone` separately as the customer destination number.
4. Optionally log `resolvedWhatChimpAccountId` from the response for debugging.

---

## Backend References

- Request validation: [reports.schemas.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/api/reports.schemas.ts:119)
- Controller: [reports.controller.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/api/reports.controller.ts:102)
- Send use case: [send-report-to-whatchimp.use-case.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/application/use-cases/send-report-to-whatchimp.use-case.ts:66)
- Provider resolution: [whatchimp-http.gateway.ts](/C:/Users/khale/OneDrive/Desktop/برنامج%20بحث%20مكسب/src/modules/reports/infrastructure/providers/whatchimp-http.gateway.ts:91)
