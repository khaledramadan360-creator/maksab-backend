# Clients Module API Design (Phase 2)

This document defines API contracts only (no controllers/routes implementation in this phase).

Base path:
- `/api/v1/clients`

## Endpoints

1. Create Client
- `POST /api/v1/clients`

2. Create Client From Search
- `POST /api/v1/clients/from-search`
- Kept separate because this flow has source-specific behavior and required fields.

3. List Clients
- `GET /api/v1/clients`

4. Get Client Details
- `GET /api/v1/clients/:clientId`

5. Update Client
- `PATCH /api/v1/clients/:clientId`

6. Change Status
- `PATCH /api/v1/clients/:clientId/status`

7. Change Owner
- `PATCH /api/v1/clients/:clientId/owner`

8. Delete Client
- `DELETE /api/v1/clients/:clientId`

9. Team Overview
- `GET /api/v1/clients/overview/team`

## Permission Matrix

### Create
- `admin`: allowed
- `manager`: allowed
- `employee`: allowed
- `viewer`: denied

### List
- `employee`: own clients only
- `manager`: all clients
- `admin`: all clients
- `viewer`: no real data

### Get Details
- `employee`: own clients only
- `manager`: all clients
- `admin`: all clients
- `viewer`: no real data

### Update
- `employee`: own clients only
- `manager`: all clients
- `admin`: all clients
- `viewer`: denied

### Change Status
- `employee`: own clients only
- `manager`: all clients
- `admin`: all clients
- `viewer`: denied

### Change Owner
- `manager`: allowed
- `admin`: allowed
- `employee`: denied
- `viewer`: denied

### Delete
- `employee`: own clients only
- `manager`: all clients
- `admin`: all clients
- `viewer`: denied

### Team Overview
- `manager`: allowed
- `admin`: allowed
- `employee`: denied
- `viewer`: denied

## Viewer Behavior (Security)

Frontend:
- viewer sees module shape only

Backend:
- viewer cannot fetch real clients data
- viewer cannot execute any clients actions

Server-side authorization is mandatory and does not rely on frontend restrictions.

## Duplicate Warning Behavior in API Flow
- create and create-from-search flows run duplicate checks in application logic
- when duplicate is found, API returns warning metadata
- caller can choose continue or cancel (override behavior is product-controlled)

## Save From Search Validation Behavior
- `saudiCity` is required
- `sourceUrl` (source platform link) is required
- `primaryPlatform` is required and should align with source behavior

