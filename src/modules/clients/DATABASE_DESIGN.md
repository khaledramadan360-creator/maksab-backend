# Clients Module Database Design (Phase 2)

This is a design document only (no migrations/models in this phase).

## Persistence Scope
The module persists clients in a primary table:
- `clients`

In v1, platform links are stored in the same `clients` table (Option A).

## Table: `clients`

Core columns:
- `id` (PK)
- `name`
- `client_type`
- `mobile`
- `whatsapp`
- `email`
- `saudi_city`
- `notes`
- `primary_platform`
- `status`
- `source_module`
- `source_platform`
- `source_url`
- `owner_user_id`
- `created_at`
- `updated_at`

Platform link columns (one link per platform in same table):
- `website_url`
- `facebook_url`
- `instagram_url`
- `snapchat_url`
- `linkedin_url`
- `x_url`
- `tiktok_url`

## Why Option A (Links in `clients`)
- simpler v1 schema
- faster implementation and querying
- aligned with rule: one link per platform only
- avoids early complexity of extra joins/table lifecycle

## Referential and Indexing Design (Planned)
- `owner_user_id` references `users.id` (FK)
- index on `owner_user_id`
- index on `status`
- index on `primary_platform`
- index on `saudi_city`
- optional index on `created_at` for list sorting

## Duplicate Strategy (Business vs Database)

Business duplicate checks are based on:
- exact mobile
- exact email
- exact social profile URL
- exact website domain

Not all duplicate prevention will be forced as DB unique constraints because:
- many fields are optional
- normalization differences can exist before compare
- product behavior requires warning + user override flow

Decision:
- duplicate detection is primarily enforced in application logic
- DB constraints can be partial/minimal for data quality, but not the full duplicate policy

## Delete Strategy
- delete is physical delete
- no soft delete column/behavior
- delete effects should still be captured in audit logs

## Status Strategy
- status is stored directly in `clients.status`
- `archived` is a business status value (not a delete substitute)

