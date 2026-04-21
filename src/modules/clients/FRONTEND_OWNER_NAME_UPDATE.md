# Clients Owner Name Update (Frontend Handoff)

Date: 2026-04-15

## What changed

Backend now returns `ownerName` for clients, so UI can render owner name directly without resolving from `ownerUserId`.

This is available in:

- `GET /api/v1/clients` (list items)
- `GET /api/v1/clients/:clientId` (details)
- Create/update/status/owner-change responses that return client details

## Response contract update

### `ClientListItemDto` (inside `GET /api/v1/clients`)

Added:

- `ownerName: string`

Still present (for compatibility):

- `ownerUserId: string`

### `ClientDetailsDto` (inside details/create/update responses)

Added:

- `ownerName: string`

Still present:

- `ownerUserId: string`

## Frontend action required

In clients table/card:

- Render owner column from `item.ownerName` (not `item.ownerUserId`).
- Keep `ownerUserId` only for internal actions when needed (e.g. owner-change forms).

## Notes

- If owner record is missing for any reason, backend returns fallback `"Unknown"`.
- No request payload changes are required from frontend in this update.

## Example (list item)

```json
{
  "id": "22a69337-4c93-46ec-99da-985a8ebba527",
  "name": "dfd",
  "clientType": "company",
  "status": "new",
  "primaryPlatform": "website",
  "saudiCity": "Riyadh",
  "ownerUserId": "301fc430-28fa-4d08-b7dd-7c6d780ada8f",
  "ownerName": "Khaled Ramadan",
  "createdAt": "2026-04-15T14:10:27.000Z",
  "updatedAt": "2026-04-15T14:10:27.000Z"
}
```
