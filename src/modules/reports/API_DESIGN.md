# Reports Module API Design (Phase 2)

This document defines API contracts only (no controllers/routes implementation in this phase).

## Base Paths
- Client-scoped actions: `/api/v1/clients`
- Reports-scoped actions: `/api/v1/reports`

## Endpoints

## 1) Generate / Re-generate Client Report

`POST /api/v1/clients/:clientId/report`

Purpose:
- if no report exists for client -> generate new report
- if report exists -> re-generate and replace old file/metadata

Request body (v1):
- empty body (fixed template flow)

Response:
- `200 OK` with latest report payload

Failure examples:
- `403 Forbidden` (scope/role violation)
- `404 Not Found` (client not found)
- `422 Unprocessable Entity` (no saved analysis for client)
- `500`/mapped provider error for render/pdf/storage failures

## 2) Get Current Client Report

`GET /api/v1/clients/:clientId/report`

Purpose:
- fetch current report for specific client

Response:
- `200 OK` + report preview payload
- `404 Not Found` if client has no report yet

## 3) List Reports

`GET /api/v1/reports`

Purpose:
- list saved reports with role-based visibility

Query params (suggested):
- `keyword?`
- `ownerUserId?`
- `status?` (`generating|ready|failed`)
- `page` (default 1)
- `pageSize` (default 20, max 100)

Response:
- `200 OK` + paginated list payload

## 4) Get Report by Id

`GET /api/v1/reports/:reportId`

Purpose:
- fetch one report by report id

Response:
- `200 OK` + report preview payload
- `404 Not Found` if report does not exist

## 5) Delete Report

`DELETE /api/v1/reports/:reportId`

Purpose:
- delete report metadata and underlying PDF file reference

Response:
- `204 No Content`

## Permission Matrix

| Action | employee | manager | admin | viewer |
|---|---|---|---|---|
| Generate / Re-generate (`POST /clients/:clientId/report`) | own only | allowed (all) | allowed (all) | forbidden |
| Get Client Report (`GET /clients/:clientId/report`) | own only | allowed (all) | allowed (all) | forbidden (no real data) |
| List Reports (`GET /reports`) | own only | allowed (all) | allowed (all) | forbidden (no real data) |
| Get Report By Id (`GET /reports/:reportId`) | own only | allowed (all) | allowed (all) | forbidden (no real data) |
| Delete Report (`DELETE /reports/:reportId`) | forbidden | allowed | allowed | forbidden |

## Viewer Behavior (Backend + Frontend)

Frontend:
- viewer may only see module UI shape/preview shell

Backend:
- viewer cannot generate, fetch, list, delete, or download real report data/files
- backend must enforce this even if frontend hides controls

## Replace Strategy (API-level behavior)

Generate endpoint (`POST /clients/:clientId/report`) performs replace flow when report exists:
1. read old report by `clientId`
2. replace/delete old PDF file in storage
3. generate and save new PDF
4. replace report metadata record (one report per client)

## Source Rules (API awareness)

Report generation must use saved data only:
- client data
- latest saved analysis
- saved screenshots

No new scraping, no new analysis, no lead-search direct dependency.

## Response Shapes (Public DTO-oriented)

## Report Payload (preview-oriented)

```json
{
  "data": {
    "report": {
      "id": "uuid",
      "clientId": "uuid",
      "analysisId": "uuid",
      "ownerUserId": "uuid",
      "ownerName": "Owner Name",
      "templateKey": "default_client_report",
      "status": "ready",
      "format": "pdf",
      "pdfUrl": "https://.../report.pdf",
      "generatedAt": "2026-04-18T10:00:00.000Z",
      "createdAt": "2026-04-18T10:00:00.000Z",
      "updatedAt": "2026-04-18T10:00:00.000Z"
    },
    "preview": {
      "clientName": "Client Name",
      "overallScore": 78.5,
      "analysisSummary": "Summary text",
      "screenshots": [
        {
          "platform": "website",
          "publicUrl": "https://.../website.png",
          "captureStatus": "captured"
        }
      ]
    }
  }
}
```

## List Payload

```json
{
  "data": {
    "items": [
      {
        "reportId": "uuid",
        "clientId": "uuid",
        "clientName": "Client Name",
        "ownerUserId": "uuid",
        "ownerName": "Owner Name",
        "status": "ready",
        "generatedAt": "2026-04-18T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

## Audit Actions Design

The module should emit:
- `client.report.generated`
- `client.report.regenerated`
- `client.report.deleted`
- `client.report.downloaded`

`client.report.downloaded` is emitted when backend serves/authorizes report file access URL/stream.

## Frontend Awareness (Design-only)

### Report Preview Page
- uses report details endpoint (`/clients/:clientId/report` or `/reports/:reportId`)
- shows report metadata + preview-friendly summary + PDF access action

### Reports List Page
- uses `GET /api/v1/reports`
- supports filters, pagination, and ownership-scoped results

### Client Details Action
- action button for generate/re-generate/open current report

