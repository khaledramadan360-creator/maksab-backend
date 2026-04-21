# Clients API Integration Report (Frontend)

Date: 2026-04-15

## 1) Backend status check

The backend was tested directly against `http://localhost:3000` and the following were confirmed:

- `POST /api/v1/clients` succeeds with valid payload.
- `POST /api/v1/clients/from-search` succeeds with valid payload.
- Validation failures return `422` with structured details:
  - `error.code = "VALIDATION_FAILED"`
  - `error.details[] = { path, message, code }`

So current rejection is caused by request payload shape/values, not by endpoint availability.

## 2) Accepted payload shape (manual create)

Endpoint:

- `POST /api/v1/clients`

Required (after normalization):

- `name` (or alias `clientName`)
- `clientType` (or alias `type`) where value is one of:
  - `person`
  - `company`
- `saudiCity` (or alias `city`)
- `primaryPlatform` (or alias `platform`) where value is one of:
  - `website`, `facebook`, `instagram`, `snapchat`, `linkedin`, `x`, `tiktok`
- `sourcePlatform` (can be derived from `primaryPlatform`/`platform` if not sent)
- `sourceUrl` (can be derived from `links` if matching platform link exists)

Optional:

- `mobile` (or alias `phone`)
- `whatsapp` (or alias `whatsApp`)
- `email`
- `notes` (aliases: `note`, `description`)
- `sourceModule` (default is `manual` if omitted)
- `links` (aliases also accepted: `clientLinks`, `platformLinks`)
- `forceCreateIfDuplicate` (alias `forceCreate`)

## 3) Accepted payload shape (create from search)

Endpoint:

- `POST /api/v1/clients/from-search`

Required:

- `name` / `clientName`
- `clientType` / `type` (`person` or `company`)
- `saudiCity` / `city`
- `sourcePlatform` (or fallback from `primaryPlatform` / `platform`)
- `sourceUrl` (or alias `sourceLink` / `platformUrl` / `profileUrl` / `url`)

Optional:

- `mobile`, `whatsapp`, `email`, `notes`, `links`, `forceCreateIfDuplicate`

## 4) Important normalization behavior

The backend now accepts both:

- plain strings, e.g. `"instagram"`
- select objects, e.g. `{ "value": "instagram", "label": "Instagram" }`

for key fields such as:

- `clientType`
- `saudiCity`
- `primaryPlatform`
- `sourcePlatform`
- `sourceModule`

## 5) Frequent 422 causes on frontend

1. Invalid enum value:

- `clientType = "individual"` (invalid)
- `primaryPlatform = "tik tok"` (invalid format; must be `tiktok`)

2. Missing platform fields:

- `primaryPlatform` missing on manual create
- `sourcePlatform` missing and cannot be derived

3. Missing source link:

- `sourceUrl` missing and no matching link in `links` for selected platform

4. Wrong city data shape:

- Sending city object without usable string fields (`value`, `label`, `name`, `id`, `text`)

5. Empty strings in required fields:

- `name = ""`
- `saudiCity = ""`

## 6) How frontend should handle validation response

On `422`, parse:

- `error.message` (general)
- `error.details[]` (field-level)

Example error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request data is invalid",
    "details": [
      {
        "path": "body.clientType",
        "message": "Invalid option: expected one of \"person\"|\"company\"",
        "code": "invalid_value"
      }
    ]
  }
}
```

UI recommendation:

- Show global toast using `error.message`.
- Show inline field errors mapped from `details.path` (`body.<fieldName>`).

## 7) Minimal valid examples

Manual create:

```json
{
  "name": "Acme Co",
  "clientType": "company",
  "saudiCity": "Riyadh",
  "primaryPlatform": "linkedin",
  "sourceModule": "manual",
  "sourcePlatform": "linkedin",
  "sourceUrl": "https://linkedin.com/company/acme"
}
```

From search:

```json
{
  "name": "Lead Result",
  "clientType": "person",
  "saudiCity": "Jeddah",
  "sourcePlatform": "instagram",
  "sourceUrl": "https://instagram.com/lead.result"
}
```

