# Analysis Module Database Design (Phase 2)

This document defines the storage model for analysis results.
Scope is design-only; no migrations or implementation in this phase.

## 1) Storage Goal

Persist final analysis output for saved clients with:
- one main analysis record per client
- per-platform analysis breakdown
- replace-on-rerun behavior

## 2) Tables

## 2.1 `client_analyses`

Represents the main (overall) analysis for a client.

Suggested columns:
- `id` (PK, UUID)
- `client_id` (FK -> `clients.id`, NOT NULL)
- `owner_user_id` (FK -> `users.id`, NOT NULL)
- `status` (ENUM: `pending|completed|failed`, NOT NULL)
- `summary` (TEXT, NULL)
- `overall_score` (DECIMAL(5,2), NULL)
- `strengths` (JSON, NOT NULL, default `[]`)
- `weaknesses` (JSON, NOT NULL, default `[]`)
- `recommendations` (JSON, NOT NULL, default `[]`)
- `analyzed_at` (DATETIME, NULL)
- `created_at` (DATETIME, NOT NULL)
- `updated_at` (DATETIME, NOT NULL)

Constraints:
- `PRIMARY KEY (id)`
- `UNIQUE (client_id)`  <- locks "one analysis per client"
- `FOREIGN KEY (client_id) REFERENCES clients(id)`
- `FOREIGN KEY (owner_user_id) REFERENCES users(id)`

Indexes:
- `INDEX idx_client_analyses_owner_user_id (owner_user_id)`
- `INDEX idx_client_analyses_status (status)`
- `INDEX idx_client_analyses_analyzed_at (analyzed_at)`

## 2.2 `client_platform_analyses`

Represents per-platform analysis under one `client_analyses` record.

Suggested columns:
- `id` (PK, UUID)
- `client_analysis_id` (FK -> `client_analyses.id`, NOT NULL)
- `platform` (ENUM: `website|facebook|instagram|snapchat|linkedin|x|tiktok`, NOT NULL)
- `platform_url` (VARCHAR(2048), NOT NULL)
- `platform_score` (DECIMAL(5,2), NULL)
- `summary` (TEXT, NULL)
- `strengths` (JSON, NOT NULL, default `[]`)
- `weaknesses` (JSON, NOT NULL, default `[]`)
- `recommendations` (JSON, NOT NULL, default `[]`)
- `created_at` (DATETIME, NOT NULL)
- `updated_at` (DATETIME, NOT NULL)

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (client_analysis_id) REFERENCES client_analyses(id) ON DELETE CASCADE`

Indexes:
- `INDEX idx_client_platform_analyses_analysis_id (client_analysis_id)`
- `INDEX idx_client_platform_analyses_platform (platform)`
- Optional uniqueness if needed later:
  - `UNIQUE (client_analysis_id, platform, platform_url)`

## 3) Replace Strategy (Locked)

Re-run must replace old analysis entirely.

Transactional sequence (single DB transaction):
1. Load existing `client_analyses` by `client_id` (if any).
2. Delete old rows from `client_platform_analyses` for old analysis id.
3. Replace `client_analyses` row for that `client_id` (update or delete+insert).
4. Insert fresh `client_platform_analyses` rows.
5. Commit.

Notes:
- Application enforces replace behavior.
- DB additionally enforces one-row-per-client with `UNIQUE(client_id)`.

## 4) Pending/Failed/Completed Support

The `status` field supports execution states:
- `pending`: run started
- `completed`: final analysis saved
- `failed`: run failed

This enables future async execution without schema changes.

## 5) Raw Scraped Data Storage Decision

For v1:
- Do **not** store raw scraped snapshots in DB.
- Keep raw scraped content transient in execution memory only.

Rationale:
- lower storage volume
- simpler compliance surface
- focus on final business output

## 6) Data Retention Notes

Because re-run replaces old data:
- only latest analysis per client remains persisted
- historical versions are not stored in v1

If version history is needed later, introduce:
- `analysis_versions` or soft-versioning strategy
- without changing current API contract in v1
