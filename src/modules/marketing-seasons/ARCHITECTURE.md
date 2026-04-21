# Marketing Seasons Module Architecture (Phase 2)

This document defines architecture and boundaries for `src/modules/marketing-seasons`.
It is design-only and includes no runtime implementation.

## Module Goal
Marketing Seasons module manages reusable marketing seasons and guarantees that only one season is active at a time.
The active season is the only season consumed by Reports for PDF rendering.

## Layered Structure

### `domain/`
Owns business language and contracts:
- enums
- entities
- business rules
- repository contracts
- use-case contracts

Domain is pure and contains no framework, DB, HTTP, or infrastructure details.

### `application/`
Owns orchestration and policy enforcement:
- use-case implementations (Phase 3)
- orchestration/policy services
- internal DTOs and mappers

Expected services:
- `marketing-season-ownership.service`
- `marketing-season-activation.service`
- `marketing-season-mapper.service`

Responsibilities:
- ownership checks and role checks: `marketing-season-ownership.service`
- employee own-only checks on update/delete: `marketing-season-ownership.service`
- single-active enforcement and activation flow: `marketing-season-activation.service`
- entity to public DTO mapping: `marketing-season-mapper.service`

Use-case placement:
- create/update/delete/list/get/activate/get-active logic lives in `application/use-cases`
- list/get orchestration and scope filters are enforced in application layer before returning data

### `infrastructure/`
Owns technical implementations of domain contracts:
- repository implementations in `infrastructure/repositories`
- persistence adapters/models in `infrastructure/persistence`
- infra data mappers in `infrastructure/mappers`

### `public/`
Owns external module boundary only:
- `marketing-seasons.facade.ts` is the single gateway
- `marketing-seasons.types.ts` contains public request/response DTOs only

No repository internals, DB internals, or permission internals are exported publicly.

### `index.ts`
Module boundary entrypoint.
Exports public facade contract and public DTOs only.
Runtime composition/wiring is planned for Phase 3.

## Dependency Direction (Strict)

Allowed:
- `public -> application`
- `application -> domain`
- `application -> domain contracts`
- `infrastructure -> domain`
- `index.ts -> public`

Forbidden:
- `domain -> infrastructure`
- `domain -> application`
- `public -> infrastructure` directly

## Public vs Internal Boundaries

Public:
- marketing seasons facade methods
- stable public DTOs for controllers/consumers

Internal:
- repository contracts/implementations
- transaction logic
- permission internals and policy details
- storage and persistence internals

## Ownership and Permissions Placement

`marketing-season-ownership.service` enforces:
- create permission (`admin/manager/employee` allowed, `viewer` forbidden)
- employee own-only mutations (update/delete own seasons only)
- manager/admin all-seasons mutations
- backend-side rejection of viewer real-data access

All ownership checks are backend-enforced and never delegated to frontend only.

## Single Active Season Enforcement Placement

`marketing-season-activation.service` owns single-active enforcement.

Activation flow (transactional design):
1. validate actor permission and target season existence
2. deactivate any currently active season(s)
3. activate requested season
4. write activation/deactivation audit logs

Single active season is enforced primarily in application transactional flow, not only via DB constraint.

## List/Get Logic Placement

Application use-cases are responsible for list/get orchestration:
- apply role-based visibility and ownership scope
- apply filters and pagination
- map entities to public DTOs via mapper service

## Reports Integration Logic

Reports integration is read-only from Reports side:
- during report generation, Reports fetches active season via `getActiveMarketingSeason`
- active season is inserted into report render payload
- Reports module does not create/update/delete/activate seasons

Suggested integration point on Reports side:
- report payload builder/orchestrator service in reports application layer

## Viewer Behavior (Mandatory)

Frontend:
- viewer can see module shape/preview only

Backend:
- viewer cannot access real seasons records
- viewer cannot create/update/delete/activate seasons
- viewer cannot consume real active-season payload

## Audit Actions Design

Use-cases should emit:
- `marketing_season.created`
- `marketing_season.updated`
- `marketing_season.deleted`
- `marketing_season.activated`
- `marketing_season.deactivated`

