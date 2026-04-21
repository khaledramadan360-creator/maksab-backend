# Marketing Seasons Module API Design (Phase 2)

This document defines API contracts only (no routes/controllers/request-validation implementation in this phase).

## Base Path
- `/api/v1/marketing-seasons`

## Endpoints

## 1) Create Season

`POST /api/v1/marketing-seasons`

Purpose:
- create a new marketing season (default status is `inactive`)

Request body:
```json
{
  "title": "Ramadan 2026",
  "description": "Season campaign focus"
}
```

Response:
- `201 Created` + created season DTO

## 2) List Seasons

`GET /api/v1/marketing-seasons`

Purpose:
- list seasons with role-scoped visibility and pagination

Query params (suggested):
- `keyword?`
- `status?` (`active|inactive`)
- `ownerUserId?`
- `page` (default 1)
- `pageSize` (default 20, max 100)

Response:
- `200 OK` + paginated list payload

## 3) Get Season By Id

`GET /api/v1/marketing-seasons/:seasonId`

Purpose:
- fetch one season by id

Response:
- `200 OK` + season DTO
- `404 Not Found` if season does not exist

## 4) Update Season

`PATCH /api/v1/marketing-seasons/:seasonId`

Purpose:
- update season data (`title` and/or `description`)

Request body:
```json
{
  "title": "Ramadan 2026 Updated",
  "description": "Updated campaign text"
}
```

Response:
- `200 OK` + updated season DTO

## 5) Delete Season

`DELETE /api/v1/marketing-seasons/:seasonId`

Purpose:
- delete a season record

Response:
- `204 No Content`

## 6) Activate Season

`POST /api/v1/marketing-seasons/:seasonId/activate`

Purpose:
- activate requested season and deactivate any currently active season

Request body:
- empty body in v1

Response:
- `200 OK` + activated season DTO

## 7) Get Active Season

`GET /api/v1/marketing-seasons/active`

Purpose:
- fetch active season payload
- used by backend consumers (notably reports generation flow)

Response:
- `200 OK` + active season DTO
- `404 Not Found` if no active season exists

## Activation Strategy (API-Level Behavior)

Activate endpoint must run as one transaction:
1. deactivate any currently active season
2. activate requested season
3. commit

No partial activation states are allowed.

## Permissions Matrix

| Action | employee | manager | admin | viewer |
|---|---|---|---|---|
| Create (`POST /marketing-seasons`) | allowed | allowed | allowed | forbidden |
| List (`GET /marketing-seasons`) | allowed | allowed | allowed | no real data (preview only in frontend) |
| Get by id (`GET /marketing-seasons/:seasonId`) | allowed | allowed | allowed | no real data (preview only in frontend) |
| Update (`PATCH /marketing-seasons/:seasonId`) | own only | allowed (all) | allowed (all) | forbidden |
| Delete (`DELETE /marketing-seasons/:seasonId`) | own only | allowed (all) | allowed (all) | forbidden |
| Activate (`POST /marketing-seasons/:seasonId/activate`) | allowed | allowed | allowed | forbidden |
| Get active (`GET /marketing-seasons/active`) | allowed | allowed | allowed | forbidden (no real data) |

## Viewer Behavior (Backend + Frontend)

Frontend:
- viewer may see module shell/preview shape only

Backend:
- viewer cannot receive real seasons data
- viewer cannot create/update/delete seasons
- viewer cannot activate seasons

## Reports Integration Contract

During report generation:
1. Reports module calls active season retrieval (`GET /marketing-seasons/active` or equivalent facade method).
2. Reports inserts active season payload into report render payload.

Reports module is read-only regarding marketing seasons:
- no create
- no update
- no delete
- no activation mutations

## Error Mapping (High-Level)

Common failures:
- `403 Forbidden`: role/scope violation
- `404 Not Found`: season not found (or active season missing for `/active`)
- `422 Unprocessable Entity`: invalid business state

Final error mapping details are defined in implementation phase.

## Audit Actions Design

The module should emit:
- `marketing_season.created`
- `marketing_season.updated`
- `marketing_season.deleted`
- `marketing_season.activated`
- `marketing_season.deactivated`

