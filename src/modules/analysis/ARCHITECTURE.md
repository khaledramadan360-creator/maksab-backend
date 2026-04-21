# Analysis Module Architecture (Phase 2 Design)

This document defines the full design for `src/modules/analysis` before implementation.
Scope is design-only (no scraping implementation, no AI implementation, no DB migrations, no API controllers/routes, no frontend code).

## 1) Module Structure

```text
src/modules/analysis/
  index.ts
  ARCHITECTURE.md
  DATABASE_DESIGN.md
  API_DESIGN.md

  public/
    analysis.facade.ts
    analysis.types.ts

  application/
    dto/
    services/
    use-cases/
    mappers/

  domain/
    enums.ts
    entities.ts
    rules.ts
    repositories.ts
    use-cases.ts
    BUSINESS_RULES.md

  infrastructure/
    providers/
    repositories/
    persistence/
    mappers/
```

## 2) Layer Responsibilities

### Public layer (`public/`)
- Single external boundary for other modules/controllers.
- Exposes only:
  - `AnalysisFacade` contract
  - public DTO types
- Must not expose:
  - repository contracts
  - provider internals
  - scraping internals
  - AI internals

### Application layer (`application/`)
- Orchestrates analysis flow and use-case execution.
- Validates permissions/ownership using policy services.
- Coordinates:
  - client lookup
  - scraping provider contract
  - AI provider contract
  - replacement strategy
  - audit logging
- Maps internal outputs to public DTOs.

### Domain layer (`domain/`)
- Pure business language:
  - enums, entities, rules
  - repository/provider contracts
  - use-case contracts
- No dependency on infrastructure or framework code.

### Infrastructure layer (`infrastructure/`)
- Implements domain contracts:
  - repositories (DB)
  - scraping provider
  - AI provider
  - persistence mappers
- Contains technical integration details only.

## 3) Dependency Direction (Locked)

- `public -> application`
- `application -> domain`
- `application -> domain contracts`
- `infrastructure -> domain`
- `index.ts -> public`

Forbidden:
- `domain -> application`
- `domain -> infrastructure`
- `public -> infrastructure` directly

## 4) Core Application Services (Design)

### `client-analysis-orchestrator.service`
- Receives run command for a client.
- Loads client links.
- Builds scrape input.
- Calls scraping provider.
- Calls AI provider with normalized scraped output.
- Returns structured analysis payload for save/replace.

### `client-analysis-ownership.service`
- Enforces role access:
  - employee: own-only
  - manager/admin: all
  - viewer: denied
- Used by run/get/delete/team use cases.

### `client-analysis-replacement.service`
- Guarantees replace-on-rerun.
- Transactional behavior:
  - remove old platform analyses
  - replace or recreate main client analysis
  - save new platform analyses

### `scraped-data-normalization.service`
- Converts provider-specific scrape output into normalized domain input.
- Removes irrelevant payload noise.
- Produces deterministic shape before AI analysis.

### `analysis-mapper.service`
- Converts domain/application outputs to public DTOs only.

## 5) Run Analysis Flow (Design)

1. Validate actor role and ownership.
2. Load target saved client and saved platform links.
3. Validate: at least one valid platform link exists.
4. Orchestrate scraping on saved links only.
5. Normalize scraped content.
6. Send normalized input to AI provider contract.
7. Build final analysis payload (overall + platform breakdown).
8. Apply replace strategy (one analysis per client).
9. Emit audit events.
10. Return mapped DTO.

## 6) Replacement Logic Location

- Business decision in domain rules.
- Operational enforcement in application (`client-analysis-replacement.service`).
- Persistence enforcement in database (`UNIQUE(client_id)` in `client_analyses`).

## 7) Ownership Checks Location

- Implemented in application services/use-cases.
- Based on:
  - actor role
  - client owner user id

## 8) Team Overview Logic Location

- Exposed as public facade method.
- Application use case applies visibility policy:
  - manager/admin: full team visibility
  - employee: own scope only
  - viewer: denied real data
- Repository returns paginated overview shape.

## 9) Scraping & AI Placement (Locked)

- Scraping: infrastructure provider implementation via domain contract.
- AI analysis: infrastructure provider implementation via domain contract.
- Orchestration between scraping and AI: application layer only.
- Domain stays provider-agnostic.

## 10) Public vs Internal Boundaries

Public (exported):
- facade contract
- public DTOs

Internal (not exported):
- domain repository contracts
- infrastructure providers
- raw scraped structures used internally
- raw AI payloads/prompts/provider responses

## 11) Frontend Integration Awareness (Design-only)

### Client Analysis Section
- Client page will read current analysis.
- Supports run/re-run action.

### Run Analysis Modal
- Confirms action start.
- Explains that all saved platforms will be analyzed automatically.

### Team Tab
- Management overview page for analysis scores/status per client.

## 12) Viewer Behavior (Locked)

Frontend:
- Viewer can see preview shape only.

Backend:
- Viewer cannot run analysis.
- Viewer cannot fetch real analysis data.
- Viewer cannot delete analysis.

## 13) Audit Event Design

Events to emit from application flow:
- `client.analysis.started`
- `client.analysis.completed`
- `client.analysis.replaced`
- `client.analysis.failed`
- `client.analysis.deleted`
