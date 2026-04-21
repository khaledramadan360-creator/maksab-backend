# Reports Module Architecture (Phase 2)

This document defines the internal architecture and boundaries for `src/modules/reports`.
It is design-only and does not include runtime implementation.

## Module Goal
Reports module is responsible for generating and managing one fixed-shape PDF report per client, based on:
- saved client data
- latest saved analysis
- saved analysis screenshots

No new scraping/search/AI is executed by reports module.

## Layered Structure

### `domain/`
Owns pure business language and contracts:
- enums
- entities
- fixed business rules
- repository/provider contracts
- use-case contracts

No framework, DB, PDF library, or storage implementation details are allowed here.

### `application/`
Owns business orchestration and policy enforcement:
- use-case implementations (in next phase)
- orchestration services
- internal DTOs and mappers

Expected services:
- `client-report-orchestrator.service`
- `client-report-ownership.service`
- `client-report-replacement.service`
- `report-render-payload-builder.service`
- `report-mapper.service`

Business logic placement:
- ownership checks: `application/services/client-report-ownership.service`
- report generation orchestration: `application/services/client-report-orchestrator.service`
- replacement flow for regenerate: `application/services/client-report-replacement.service`
- payload assembly for template: `application/services/report-render-payload-builder.service`
- entity to DTO mapping: `application/mappers` or `application/services/report-mapper.service`

### `infrastructure/`
Owns technical implementations of contracts:
- DB repositories in `infrastructure/repositories`
- persistence models/adapters in `infrastructure/persistence`
- infra mappers in `infrastructure/mappers`
- technical providers in `infrastructure/providers`

Provider responsibilities:
- HTML template renderer provider (developer-authored HTML/CSS templates)
- PDF generator provider (html/css -> pdf binary)
- PDF storage provider (Supabase Storage in v1)
- template definition provider/repository (hardcoded template in v1, still behind contract)

### `public/`
Owns external module boundary only:
- `reports.facade.ts` as the only gateway
- `reports.types.ts` as public DTOs

No repositories/providers/internal entities are exposed.

### `index.ts`
Module entrypoint and composition root boundary (design in this phase).
Exports only public facade contract and public DTOs.

## Dependency Direction (Strict)

Allowed:
- `public -> application`
- `application -> domain`
- `application -> domain contracts`
- `infrastructure -> domain`
- `index.ts -> public`

Forbidden:
- `domain -> application`
- `domain -> infrastructure`
- `public -> infrastructure` directly

## Public vs Internal Boundaries

Public:
- reports facade methods
- public DTOs for API/controller consumption

Internal:
- render payload internals
- HTML/CSS template internals
- PDF generation/storage implementations
- repository/provider implementations

## Data Acquisition Boundaries

Reports module gathers report source data through contracts:
- client core data via `ReportsClientsLookupRepository`
- latest analysis + screenshots via `ReportsAnalysisLookupRepository`

Reports module never reads search providers directly and never triggers scraping/AI workflows.

## HTML Rendering and PDF Generation Placement

### HTML Rendering
- located in `infrastructure/providers` behind `ReportRendererContract`
- template authored and controlled by developers

### PDF Generation
- located in `infrastructure/providers` behind `ReportRendererContract` (or separate PDF provider implementation)
- accepts rendered HTML/CSS and returns PDF binary

### Orchestration
- done in `application/services/client-report-orchestrator.service`
- sequence:
  1. load render payload
  2. load template definition
  3. render HTML
  4. generate PDF
  5. store file
  6. replace report record (if regenerate)

## Storage Placement

PDF file storage is designed to use Supabase Storage in v1 via `ReportPdfStorageProviderContract`.

Only metadata is saved in DB:
- report status
- format
- `pdf_path`
- `pdf_url`
- linkage to `client_id` and `analysis_id`

HTML output is not stored in DB in v1.

## Replacement Logic Placement

`client-report-replacement.service` owns regenerate replace behavior:
1. find previous report (if exists)
2. replace/delete old PDF file via storage provider
3. store new PDF file
4. replace DB record for same client (`one report per client`)

## Ownership Checks Placement

`client-report-ownership.service` enforces:
- employee own-only access
- manager/admin all-clients access
- viewer blocked from real report actions/data

All checks are enforced backend-side.

## Reports List Logic Placement

Reports list query orchestration lives in application use-case/service layer:
- applies role-based scope
- applies filters/pagination
- maps entity -> list DTO

## Frontend Awareness (Design Only)

### Report Preview Page
- consumes report details endpoint
- shows PDF preview URL + report metadata
- can include analysis summary and screenshot references

### Reports List Page
- consumes reports list endpoint
- shows report status, owner, client, generated date

### Client Details Action
- supports generate/re-generate and open current report

No frontend implementation in this phase; this is boundary awareness only.

## Viewer Behavior (Mandatory)

Frontend:
- viewer may see module UI shape only

Backend:
- viewer cannot generate reports
- viewer cannot access real report records
- viewer cannot download/open real report PDF URLs

## Audit Design Awareness

Use-cases should emit audit events:
- `client.report.generated`
- `client.report.regenerated`
- `client.report.deleted`
- `client.report.downloaded`

