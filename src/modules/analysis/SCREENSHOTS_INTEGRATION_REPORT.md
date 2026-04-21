# Analysis Screenshots Integration Report

## Scope
Feature implemented inside `analysis` module (not a separate module).

## Behavior Summary
- Screenshots are captured from already-saved client platform links only.
- Screenshots are uploaded to Supabase Storage.
- Screenshot metadata is saved in DB table `client_analysis_screenshots`.
- Screenshots are returned with analysis response payload.
- Screenshot pipeline is **best-effort**:
  - analysis success does not depend on screenshot success,
  - failed screenshots are returned with `captureStatus = "failed"`.
- Screenshots are **visual evidence only**:
  - not sent to AI,
  - not used in scoring,
  - not used in strengths/weaknesses/recommendations.

## API Response Change
Endpoint:
- `GET /api/v1/clients/:clientId/analysis`
- `POST /api/v1/clients/:clientId/analysis` (run and return latest)

`data` now includes:

```json
{
  "id": "analysis-id",
  "clientId": "client-id",
  "platformAnalyses": [],
  "screenshots": [
    {
      "platform": "website",
      "platformUrl": "https://example.com",
      "supabasePath": "client-id/2026-04-18T10-00-00-000Z/website.png",
      "publicUrl": "https://<project>.supabase.co/storage/v1/object/public/analysis-screenshots/client-id/2026-04-18T10-00-00-000Z/website.png",
      "captureStatus": "captured",
      "capturedAt": "2026-04-18T10:00:00.000Z"
    },
    {
      "platform": "linkedin",
      "platformUrl": "https://linkedin.com/company/example",
      "supabasePath": null,
      "publicUrl": null,
      "captureStatus": "failed",
      "capturedAt": null
    }
  ]
}
```

## Status Enum
- `pending`
- `captured`
- `failed`

## Replacement / Re-run Logic
When analysis is re-run:
- previous screenshot metadata is deleted,
- previous screenshot files are deleted from Supabase (best-effort),
- new metadata is saved for current analysis.

## Delete Analysis Logic
When analysis is deleted:
- related screenshot DB metadata is removed (cascade),
- related screenshot files are deleted from Supabase (best-effort).

## Required Environment Variables
- `BRIGHT_DATA_WS_ENDPOINT` (or `BRIGHTDATA_WS_ENDPOINT`) for screenshot capture provider.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (fallback: `SUPABASE_ANON_KEY`)
- Optional:
  - `ANALYSIS_SCREENSHOT_SUPABASE_BUCKET` (default: `analysis-screenshots`)
  - `ANALYSIS_SCREENSHOT_TIMEOUT_MS` (default: `25000`)
  - `ANALYSIS_SCREENSHOT_STORAGE_TIMEOUT_MS` (default: `20000`)
  - `ANALYSIS_SCREENSHOT_USE_SIGNED_URL=true` to return signed URLs
  - `ANALYSIS_SCREENSHOT_SIGNED_URL_EXPIRES_IN_SEC` (default: `86400`)

## Frontend Handling Notes
- Render screenshot card by `captureStatus`:
  - `captured`: show image from `publicUrl`
  - `failed`: show placeholder + "تعذر التقاط الصورة"
  - `pending`: show loading/skeleton (future-proof)
- Do not block analysis UI when screenshot fails.
