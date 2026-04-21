# Analysis Module Business Rules (Phase 1)

This document locks the domain behavior for `src/modules/analysis` before adding scraping implementation, AI provider implementation, database, API routes, controllers, or frontend.

## Module purpose
The analysis module is responsible for analyzing a saved client using the client's saved platform links.

## Analysis target
- Analysis is allowed only for a saved client in the system.
- Analysis is not allowed for raw lead-search results.
- Analysis is not allowed for a free link that is not attached to a saved client.

## Data source
- Analysis input comes from scraping the links already saved on the client profile.
- The module must not perform a fresh lead search during analysis execution.

## AI usage
- AI is used to produce:
  - summary
  - overall score
  - per-platform scores
  - strengths
  - weaknesses
  - recommendations

## Auto platform behavior
- The module automatically analyzes all valid saved platforms for the client.
- Manual platform selection is out of scope for v1.

## Replace behavior
- One analysis per client only.
- Re-run replaces the old analysis completely (replace-on-rerun).

## Roles and permissions
- `employee`: can run and view analysis for owned clients only.
- `manager` and `admin`: can run and view analysis for all clients.
- `viewer`: preview mode only, no real analysis data and no analysis execution.

## Output requirements
Each completed analysis must include:
- summary
- overall score
- platform scores
- strengths
- weaknesses
- recommendations

## Viewer preview mode
- Viewer can see module shape only.
- Viewer cannot access real analysis data.
- Viewer cannot trigger analysis execution.

## No links behavior
- Analysis execution is blocked when the client has no valid saved platform links.

## Team visibility
- Team analysis overview is visible for manager/admin scope.
- Employee visibility is restricted to owned clients only.

## Explicit decisions locked in phase 1

### One analysis per client
Each client can have only one active saved analysis.

### Re-run replaces old
Running analysis again fully replaces the old saved analysis.

### All saved platforms analyzed automatically
All valid saved platform links are included automatically in each run.

### Employee own-only analysis access
Employee access is limited to owned clients for both run and read flows.

### Viewer has no real analysis data
Viewer has preview-only access with no real data and no execution capability.

### Analysis is client-bound
Analysis is always bound to a client entity, never to a free link or temporary search item.
