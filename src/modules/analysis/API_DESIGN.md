# Analysis Module API Design (Phase 2)

This document defines API contract and authorization behavior for the analysis module.
Scope is design-only; endpoints are not implemented in this phase.

## 1) Base Principles

- Analysis is client-bound (`:clientId` path).
- Re-run uses same run endpoint and replaces old analysis.
- Viewer is blocked from real analysis APIs.
- Team overview is management-focused.

## 2) Endpoints

## 2.1 Run / Re-run Analysis

`POST /api/v1/clients/:clientId/analysis`

Purpose:
- Start first analysis for a client, or
- Re-run and replace existing analysis

Request body (v1):
- empty body (all saved platforms analyzed automatically)

Response:
- `200 OK` with latest analysis payload

Failure examples:
- `403 Forbidden` (role/scope violation)
- `404 Not Found` (client not found)
- `422 Unprocessable Entity` (no valid saved platform links)
- `500`/mapped domain error for execution failure

## 2.2 Get Client Analysis

`GET /api/v1/clients/:clientId/analysis`

Purpose:
- Fetch latest saved analysis for client

Response:
- `200 OK` + analysis payload
- `404 Not Found` when no analysis exists yet

## 2.3 Delete Client Analysis

`DELETE /api/v1/clients/:clientId/analysis`

Purpose:
- Delete current saved analysis for client

Response:
- `204 No Content`

## 2.4 Team Analysis Overview

`GET /api/v1/clients/analysis/overview/team`

Purpose:
- Paginated team-level view of clients and latest analysis status/score

Query params (suggested):
- `keyword?`
- `ownerUserId?`
- `hasAnalysis?` (`true|false`)
- `page` (default 1)
- `pageSize` (default 20, max 100)

Response:
- `200 OK` + paginated overview payload

## 3) Permission Matrix (Locked)

| Action | employee | manager | admin | viewer |
|---|---|---|---|---|
| Run Analysis | own only | allowed (all) | allowed (all) | forbidden |
| Get Analysis | own only | allowed (all) | allowed (all) | forbidden (no real data) |
| Delete Analysis | forbidden | allowed (all) | allowed (all) | forbidden |
| Team Overview | forbidden | allowed | allowed | forbidden |

Notes:
- Ownership is enforced server-side in all client-scoped endpoints.
- Viewer preview mode is frontend-only; backend still blocks real-data APIs.

## 4) Response Shapes (Public DTO-oriented)

## 4.1 Analysis Response

```json
{
  "data": {
    "clientId": "uuid",
    "ownerUserId": "uuid",
    "status": "completed",
    "summary": "Overall summary text",
    "overallScore": 78.5,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "recommendations": ["..."],
    "analyzedAt": "2026-04-16T10:10:00.000Z",
    "platformAnalyses": [
      {
        "platform": "instagram",
        "platformUrl": "https://instagram.com/example",
        "platformScore": 74.0,
        "summary": "...",
        "strengths": ["..."],
        "weaknesses": ["..."],
        "recommendations": ["..."]
      }
    ]
  }
}
```

## 4.2 Team Overview Response

```json
{
  "data": {
    "items": [
      {
        "clientId": "uuid",
        "clientName": "Client Name",
        "ownerUserId": "uuid",
        "ownerName": "Owner Name",
        "overallScore": 78.5,
        "analyzedAt": "2026-04-16T10:10:00.000Z",
        "hasAnalysis": true
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

## 5) Audit Actions (Design)

Emit the following events from analysis use-cases:
- `client.analysis.started`
- `client.analysis.completed`
- `client.analysis.replaced`
- `client.analysis.failed`
- `client.analysis.deleted`

Minimal metadata:
- `actorUserId`
- `clientId`
- `status`
- `hadPreviousAnalysis`
- `platformsAnalyzed`
- `executedAt`

## 6) Frontend Awareness (Design-only)

- Client page Analysis Section consumes:
  - `GET /clients/:clientId/analysis`
  - `POST /clients/:clientId/analysis` (run/re-run)
- Run Analysis modal calls run endpoint and shows progress/result status.
- Team tab for management consumes:
  - `GET /clients/analysis/overview/team`

No frontend behavior is implemented in this phase.
