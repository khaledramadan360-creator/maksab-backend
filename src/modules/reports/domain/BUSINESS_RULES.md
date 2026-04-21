# Reports Module Business Rules (Phase 1)

## Module purpose
Reports module is responsible for generating a fixed-shape PDF report for each client using already-saved client and analysis data.

## Report source
- Report data source is:
  - saved client data
  - latest saved analysis data
  - saved analysis screenshots
- Report data source is not:
  - direct lead search results
  - new scraping during report generation
  - new AI analysis during report generation

## Report template behavior
- Report uses one fixed template in v1.
- Template key is `default_client_report`.
- Developer controls HTML/CSS template structure.
- End user cannot choose template and cannot change layout.

## Report lifecycle
- One report per client in v1.
- Re-generate operation replaces old report completely.
- Status lifecycle:
  - `generating`
  - `ready`
  - `failed`

## Report storage
- Stored format is PDF only in v1 (`pdf`).
- PDF is stored in system storage via report PDF storage provider.
- Regenerate must replace previous PDF file.

## Roles and permissions
- `employee`: generate/get/list own clients reports only.
- `manager` and `admin`: generate/get/list for all clients.
- `viewer`: cannot generate/get/list/download real report data.

## Viewer preview mode
- Viewer may see module shell shape in UI only.
- Viewer has no access to real report records or downloadable files.

## No analysis no report
- Report generation is blocked if no saved analysis exists for the client.

## Team visibility
- Team reports list follows same ownership rules:
  - employee own-only
  - manager/admin all
  - viewer no real data

## Locked decisions (explicit)
- Report is analysis-based.
- One report per client.
- Re-generate replaces old report.
- Developer-controlled template.
- Employee own-only scope.
- Viewer has no real report data.

## Out of scope in this phase
- No PDF generation implementation.
- No HTML renderer implementation.
- No DB schema or migrations.
- No API routes/controllers.
- No frontend UI.
- No storage upload implementation.

