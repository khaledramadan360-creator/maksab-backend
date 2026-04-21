# Reports Module Database Design (Phase 2)

This is a design document only (no migrations/models implementation in this phase).

## Persistence Scope
Primary reports table:
- `client_reports`

The table stores report metadata and file reference only.
PDF binary file itself is stored in external object storage (Supabase Storage in v1).

## Table: `client_reports`

Planned columns:
- `id` (PK, UUID/CHAR(36))
- `client_id` (FK -> `clients.id`)
- `analysis_id` (FK -> `client_analyses.id`)
- `owner_user_id` (FK -> `users.id`)
- `template_key` (string, e.g. `default_client_report`)
- `status` (`generating | ready | failed`)
- `format` (`pdf`)
- `pdf_path` (storage object path, nullable during generating/failed)
- `pdf_url` (accessible URL or signed URL snapshot, nullable)
- `generated_at` (nullable timestamp)
- `created_at`
- `updated_at`

## One Report Per Client Constraint

Business rule requires one report per client.

DB design decision:
- add `UNIQUE(client_id)`

This enforces:
- no more than one active report metadata row per client
- regenerate flow performs replace/update of same logical record

## Indexing Plan

Recommended indexes:
- unique index on `client_id`
- index on `owner_user_id`
- index on `status`
- index on `generated_at`
- optional composite index on (`status`, `generated_at`) for list page sorting/filtering

## Referential Integrity

Recommended foreign keys:
- `client_id` -> `clients(id)` with `ON DELETE CASCADE`
- `analysis_id` -> `client_analyses(id)` with `ON DELETE RESTRICT` or `CASCADE` based on delete policy
- `owner_user_id` -> `users(id)` with `ON DELETE RESTRICT`

Final FK delete actions will be confirmed in implementation phase against cross-module delete behavior.

## Replace Strategy (DB + Storage)

On re-generate:
1. load existing report row by `client_id` (if any)
2. replace/delete old PDF file in storage
3. save new PDF file
4. replace/update same report row metadata (`analysis_id`, `status`, `pdf_path`, `pdf_url`, `generated_at`, `updated_at`)

## HTML Storage Decision

Decision in v1:
- HTML is not stored in database.

Reason:
- template is fixed and developer-controlled in code
- only generated PDF metadata needs persistence

## Relationship to Analysis and Screenshots

Report consumes:
- `client_analyses` latest record
- related analysis screenshots (read from analysis module persistence)

No report-specific screenshots table is introduced in this phase.

