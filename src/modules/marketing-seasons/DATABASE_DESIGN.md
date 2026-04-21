# Marketing Seasons Module Database Design (Phase 2)

This document is design-only (no migrations/models implementation in this phase).

## Persistence Scope
Primary table:
- `marketing_seasons`

This table stores season metadata and activation state.

## Table: `marketing_seasons`

Planned columns:
- `id` (PK, UUID/CHAR(36))
- `title` (string, required)
- `description` (text, nullable)
- `status` (`active | inactive`)
- `owner_user_id` (FK -> `users.id`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Indexing Plan

Required indexes:
- index on `status`
- index on `owner_user_id`

Optional helpful indexes (implementation decision in Phase 3):
- index on `created_at`
- composite index on (`owner_user_id`, `created_at`) for ownership-scoped list sorting

## Referential Integrity

Recommended foreign key:
- `owner_user_id` -> `users(id)` with `ON DELETE RESTRICT`

Final FK delete behavior will be confirmed in implementation phase based on cross-module deletion policy.

## Single Active Season Decision

Business rule:
- only one active season is allowed at any time.

Design decision:
- enforcement is primarily in application logic (transactional activation flow), not only DB constraint.

Optional DB hardening can be considered later, but application flow remains the source of truth.

## Activation Strategy (Transactional)

When activating a season:
1. start transaction
2. set any current active season(s) to `inactive`
3. set requested season to `active`
4. commit transaction

If any step fails, rollback to avoid multiple active seasons or partial state.

## Out of Scope in This Phase

- no SQL migration scripts
- no ORM/Sequelize model definitions
- no repository implementation

