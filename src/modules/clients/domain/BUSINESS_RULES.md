# Clients Module Business Rules (Phase 1)

This document locks the domain behavior for `src/modules/clients` before any database, API, controller, or frontend implementation.

## Module purpose
The clients module is responsible for saving and managing clients inside the system.

## Save from search behavior
- Saving a client from search requires:
  - `saudiCity`
  - source platform link (`sourceUrl`)
  - `primaryPlatform`
- The source platform is the primary platform in create-from-search flow.
- Additional platform links are optional.

## Ownership model
- Each client has exactly one owner.
- In v1, client creator is always the initial owner.
- Manager/Admin can reassign ownership to another valid user.

## Roles and permissions
- `admin`, `manager`, and `employee` can create clients.
- `employee` can only view and act on clients they own.
- `manager` and `admin` can view and act on all clients.
- `viewer` can only see module UI shape (preview mode), without real data and without actions.

## Client statuses
- `new`
- `contacted`
- `interested`
- `not_interested`
- `converted`
- `archived`

## Delete behavior
- Delete is physical delete.
- Delete is not archive logic.
- `archived` remains a valid status that can be set through status change.

## Duplicate detection
Duplicate is detected when any of the following matches exactly:
- mobile
- email
- social profile URL
- website domain

If duplicate is detected:
- the system must show a warning
- the user can still choose to continue or cancel

## Links model
- One link only per platform.
- Primary platform link must exist.
- Source platform link is mandatory in create-from-search flow.

## Audit logging
The module should emit audit logs for:
- `client.created`
- `client.updated`
- `client.deleted`
- `client.status.changed`
- `client.owner.changed`
- `client.link.updated`
- `client.duplicate.detected`

## Explicit decisions locked in phase 1

### Create-from-search minimum requirements
It is not allowed to save a search result as a client without:
- city
- source platform link

### Viewer preview mode
Viewer sees module shape only, without real data.

### Employee scope
Employee can view, edit, change status, and delete only owned clients.

### Manager/Admin scope
Manager and Admin can view all clients, edit them, change statuses, and reassign ownership.

### Duplicate warning behavior
When duplicate exists, the system warns and leaves final decision to the user (continue or cancel).

