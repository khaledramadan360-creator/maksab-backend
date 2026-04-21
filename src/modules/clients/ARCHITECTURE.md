# Clients Module Architecture (Phase 2)

This document defines the internal architecture and boundaries for `src/modules/clients`.
It is design-only and does not include runtime implementation.

## Module Goal
The clients module owns:
- creating and managing clients
- ownership and access scope rules
- duplicate warning flow
- client status transitions
- save-from-search behavior

## Layered Structure

### `domain/`
Owns pure business language and contracts:
- enums
- entities
- business rules/constants
- repository contracts
- use-case contracts

No infrastructure or framework details are allowed in this layer.

### `application/`
Owns orchestration of use cases and policy enforcement:
- use-case implementations (later phase)
- application services for business checks/policies
- internal mappers
- DTO contracts used inside module internals

Main expected services:
- `client-duplicate-check.service`
- `client-ownership.service`
- `client-status-policy.service`
- `client-mapper.service`

Business logic placement:
- ownership checks: `application/services/client-ownership.service`
- duplicate decision + warning flow: `application/services/client-duplicate-check.service`
- status transition policy: `application/services/client-status-policy.service`
- entity to public DTO mapping: `application/mappers`

### `infrastructure/`
Owns technical implementations of domain/application contracts:
- repository implementations in `infrastructure/repositories`
- persistence adapters in `infrastructure/persistence`
- technical mappers in `infrastructure/mappers`

This layer can depend on domain contracts and application contracts, but not the other way around.

### `public/`
Owns the only external API of the module:
- `clients.facade.ts` (module gateway)
- `clients.types.ts` (public DTOs only)

No repository or infrastructure details may leak through this boundary.

### `index.ts`
Composition root and module entry point:
- wires dependencies
- exposes only the public facade and public types

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
- `public -> infrastructure` (directly)

## Public vs Internal Boundaries

Public API:
- facade methods in `public/clients.facade.ts`
- public DTOs in `public/clients.types.ts`

Internal only:
- domain entities/contracts
- application services/use-case internals
- infrastructure repositories/persistence

## Ownership, Duplicate, and Status Logic Boundaries

- Ownership rules are enforced in application layer and read from domain rules.
- Duplicate detection strategy is orchestrated in application layer using repository contracts.
- Status change rules are validated in application layer against domain enums/rules.
- Save-from-search minimum requirements are validated in application layer before calling repositories.

## Mapper Strategy

Required mappers:
- `entity -> dto` mapper (internal to application/public mapping flow)
- `search result -> create client input` mapper (planned for Lead Search integration flow)

This keeps `lead-search` integration explicit and avoids leaking raw search payloads to clients domain.

## Viewer Security Behavior (Backend + Frontend)

Frontend:
- viewer sees module shape only (preview mode)

Backend:
- viewer must not receive real clients data
- viewer must not execute create/update/delete/status/owner actions

Data protection is enforced server-side and must not rely on frontend-only restrictions.

