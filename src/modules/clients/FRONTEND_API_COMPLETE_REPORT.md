# Clients Module - Frontend API Complete Report

Date: 2026-04-15  
Module Base URL: `/api/v1/clients`

## 1) Authentication

- All clients endpoints require `Authorization: Bearer <accessToken>`.
- If token is missing/invalid:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token"
  }
}
```

or

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired access token"
  }
}
```

## 2) Standard Response Format

- Success responses:
  - `{"data": ...}`
- Validation failure:

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

- Business errors:
  - `403` -> `AuthorizationError`
  - `404` -> `NotFoundError`
  - `409` duplicate:

```json
{
  "error": {
    "code": "DUPLICATE_CLIENT",
    "message": "Duplicate client detected",
    "duplicate": {
      "isDuplicate": true,
      "matchedBy": "email",
      "matchedClientId": "uuid",
      "matchedFields": ["email"]
    }
  }
}
```

## 3) Enums (must match exactly)

- `clientType`: `person`, `company`
- `status`: `new`, `contacted`, `interested`, `not_interested`, `converted`, `archived`
- `platform`: `website`, `facebook`, `instagram`, `snapchat`, `linkedin`, `x`, `tiktok`
- `sourceModule`: `manual`, `lead_search`

## 4) Permissions Matrix

- `POST /` create: `admin`, `manager`, `employee`
- `POST /from-search`: `admin`, `manager`, `employee`
- `GET /` list: `admin`, `manager`, `employee`
- `GET /:clientId`: `admin`, `manager`, `employee`
- `PATCH /:clientId`: `admin`, `manager`, `employee`
- `PATCH /:clientId/status`: `admin`, `manager`, `employee`
- `DELETE /:clientId`: `admin`, `manager`, `employee`
- `PATCH /:clientId/owner`: `admin`, `manager`
- `GET /overview/team`: `admin`, `manager`
- `GET /owners/options`: `admin`, `manager`

Notes:
- `viewer` cannot access real clients data/actions.
- `employee` can only see/edit/delete/change status for own clients.

## 5) API Endpoints

## 5.1 Create Manual Client

- Method/Path: `POST /api/v1/clients`
- Allowed roles: `admin`, `manager`, `employee`

Accepted request body (canonical fields):

```json
{
  "name": "Client Name",
  "clientType": "person",
  "mobile": "0500000000",
  "whatsapp": "0500000000",
  "email": "client@example.com",
  "saudiCity": "Riyadh",
  "notes": "notes",
  "primaryPlatform": "instagram",
  "sourceModule": "manual",
  "sourcePlatform": "instagram",
  "sourceUrl": "https://instagram.com/client",
  "links": {
    "websiteUrl": null,
    "facebookUrl": null,
    "instagramUrl": "https://instagram.com/client",
    "snapchatUrl": null,
    "linkedinUrl": null,
    "xUrl": null,
    "tiktokUrl": null
  },
  "forceCreateIfDuplicate": false
}
```

Aliases accepted in create only:
- `clientName` -> `name`
- `type` -> `clientType`
- `city` -> `saudiCity`
- `platform` -> `primaryPlatform` (and fallback for `sourcePlatform`)
- `source` -> `sourceModule`
- `sourceLink|platformUrl|profileUrl|url` -> `sourceUrl`
- `phone` -> `mobile`
- `whatsApp` -> `whatsapp`
- `note|description` -> `notes`
- `clientLinks|platformLinks` -> `links`
- `forceCreate` -> `forceCreateIfDuplicate`

Important behavior:
- `sourceModule` defaults to `manual` if omitted.
- If `sourceUrl` omitted, backend tries derive it from `links` by selected source/primary platform.
- If duplicate found and `forceCreateIfDuplicate=false` => `409 DUPLICATE_CLIENT`.
- If duplicate found and `forceCreateIfDuplicate=true` => create succeeds and includes `duplicateWarning`.

Success response (`201`):

```json
{
  "data": {
    "client": {
      "id": "uuid",
      "name": "Client Name",
      "clientType": "person",
      "mobile": null,
      "whatsapp": null,
      "email": null,
      "saudiCity": "Riyadh",
      "notes": null,
      "primaryPlatform": "instagram",
      "status": "new",
      "sourceModule": "manual",
      "sourcePlatform": "instagram",
      "sourceUrl": "https://instagram.com/client",
      "ownerUserId": "uuid",
      "ownerName": "Owner Name",
      "createdAt": "2026-04-15T00:00:00.000Z",
      "updatedAt": "2026-04-15T00:00:00.000Z",
      "links": {
        "websiteUrl": null,
        "facebookUrl": null,
        "instagramUrl": "https://instagram.com/client",
        "snapchatUrl": null,
        "linkedinUrl": null,
        "xUrl": null,
        "tiktokUrl": null
      }
    },
    "duplicateWarning": {
      "isDuplicate": true,
      "matchedBy": "mobile",
      "matchedClientId": "uuid",
      "matchedFields": ["mobile"]
    }
  }
}
```

## 5.2 Create Client From Search

- Method/Path: `POST /api/v1/clients/from-search`
- Allowed roles: `admin`, `manager`, `employee`

Required rules:
- `name`
- `clientType`
- `saudiCity`
- `sourcePlatform`
- `sourceUrl`

Aliases accepted:
- `clientName`, `type`, `city`
- `sourceLink|platformUrl|profileUrl|url` for `sourceUrl`
- `primaryPlatform|platform` can be fallback for `sourcePlatform`

Important behavior:
- `sourceModule` is forced to `lead_search` internally.
- `primaryPlatform` in resulting client equals `sourcePlatform`.
- Duplicate behavior same as manual create.

Response: same envelope shape as manual create (`201`).

## 5.3 List Clients

- Method/Path: `GET /api/v1/clients`
- Allowed roles: `admin`, `manager`, `employee`

Query params:
- `keyword` optional
- `status` optional enum
- `ownerUserId` optional UUID
- `primaryPlatform` optional enum
- `saudiCity` optional
- `includeArchived` optional boolean (`true/false/1/0/yes/no`)
- `page` optional, default `1`
- `pageSize` optional, default `20`, max `100`

Notes:
- Empty query values are tolerated and ignored (no 422 for blank filter values).
- `employee` owner filter is forced to own id (own-only scope).

Success response (`200`):

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Client Name",
        "clientType": "person",
        "status": "new",
        "primaryPlatform": "website",
        "saudiCity": "Riyadh",
        "ownerUserId": "uuid",
        "ownerName": "Owner Name",
        "createdAt": "2026-04-15T00:00:00.000Z",
        "updatedAt": "2026-04-15T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

## 5.4 Get Client Details

- Method/Path: `GET /api/v1/clients/:clientId`
- Allowed roles: `admin`, `manager`, `employee`
- `clientId` must be UUID

Success response (`200`): full `ClientDetailsDto` (same shape as create result `client` object).
Not found (`404`):

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Client not found"
  }
}
```

## 5.5 Update Client

- Method/Path: `PATCH /api/v1/clients/:clientId`
- Allowed roles: `admin`, `manager`, `employee`

Body fields (all optional):
- `name`, `clientType`, `mobile`, `whatsapp`, `email`, `saudiCity`, `notes`, `primaryPlatform`, `sourceUrl`, `links`

Important:
- Update endpoint expects canonical field names (no aliases normalization here).
- If `primaryPlatform` changed, matching primary link must exist after merge.

Success (`200`): returns full `ClientDetailsDto`.

## 5.6 Change Client Status

- Method/Path: `PATCH /api/v1/clients/:clientId/status`
- Allowed roles: `admin`, `manager`, `employee`

Body:

```json
{
  "status": "contacted"
}
```

Success (`200`): returns full `ClientDetailsDto`.

## 5.7 Change Client Owner

- Method/Path: `PATCH /api/v1/clients/:clientId/owner`
- Allowed roles: `admin`, `manager`

Body:

```json
{
  "newOwnerUserId": "uuid"
}
```

Validations:
- user must exist
- user must be active and can own clients (`admin/manager/employee`)

Success (`200`): returns full `ClientDetailsDto` with new `ownerUserId` and `ownerName`.

## 5.8 Delete Client

- Method/Path: `DELETE /api/v1/clients/:clientId`
- Allowed roles: `admin`, `manager`, `employee` (employee own-only)
- Success: `204` with empty body

## 5.9 Team Overview

- Method/Path: `GET /api/v1/clients/overview/team`
- Allowed roles: `admin`, `manager`

Success (`200`):

```json
{
  "data": [
    {
      "employeeId": "uuid",
      "employeeName": "Employee Name",
      "clientsCount": 12
    }
  ]
}
```

## 5.10 Owner Dropdown Options (for Change Owner UI)

- Method/Path: `GET /api/v1/clients/owners/options`
- Allowed roles: `admin`, `manager`

Query:
- `keyword` optional (search in fullName/email)
- `limit` optional (default `100`, max `200`)

Success (`200`):

```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Mksab Admin",
      "role": "admin"
    },
    {
      "id": "uuid",
      "fullName": "Khaled Ramadan",
      "role": "employee"
    }
  ]
}
```

Frontend select mapping:
- `label = fullName`
- `value = id`

## 6) Frontend Safety Checklist (to avoid missing cases)

1. Always send Bearer token.
2. Handle `422` and show field-level errors from `error.details`.
3. Handle `409 DUPLICATE_CLIENT` in create/from-search with confirmation flow:
   - first call with `forceCreateIfDuplicate=false`
   - if duplicate and user confirms -> resend with `true`
4. In list screen, if filters empty, either omit params or send blank safely (backend tolerates blank list filters).
5. In owner change modal:
   - load dropdown from `/owners/options`
   - submit selected id to `PATCH /:clientId/owner`
6. Use `ownerName` for display, keep `ownerUserId` for internal actions only.

