# Marketing Seasons Module Business Rules (Phase 1)

## Module purpose
Marketing Seasons module is responsible for managing marketing seasons where only one season can be shown as active in PDF reports.

## Single active season policy
- More than one season can be stored.
- Only one season can be `active` at any time.

## Default status
- Every new season starts as `inactive`.

## Roles and permissions
- `admin`, `manager`, `employee` can create seasons.
- `employee` can update and delete own seasons only.
- `manager` and `admin` can update and delete all seasons.
- `viewer` can access module preview shape only (no real data, no actions).

## Reports integration
- Reports module consumes the active season only.
- Inactive seasons are excluded from PDF generation.

## Viewer preview mode
- Viewer sees module shell/preview only.
- Viewer has no access to real marketing seasons data.
- Viewer cannot run create/update/delete/activate actions.

## Activation behavior
- Activating a new season must deactivate any currently active season first.
- Then the requested season becomes `active`.

## Locked decisions (explicit)
- One active season only.
- Employee can create seasons.
- Employee own-only mutations.
- Reports consume active season only.
- Viewer has no real data.

## Out of scope in this phase
- No DB schema, models, or migrations.
- No API routes/controllers/request validation.
- No frontend UI.
- No report payload wiring implementation.
