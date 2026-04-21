# Change Owner Dropdown Report (Frontend)

Date: 2026-04-15

## Goal

Enable owner reassignment using a dropdown of user names instead of manually typing user UUID.

## New API endpoint

- `GET /api/v1/clients/owners/options`
- Auth required: `Bearer <accessToken>`
- Allowed roles: `admin`, `manager`
- `employee` and `viewer` are not allowed

## Query params

- `keyword` (optional): filter by full name or email
- `limit` (optional): max number of options (default `100`, max `200`)

Example:

`GET /api/v1/clients/owners/options?keyword=kh&limit=20`

## Response shape

```json
{
  "data": [
    {
      "id": "0294ea16-4641-4c8c-94b4-fd62d2a15d5c",
      "fullName": "Mksab Admin",
      "role": "admin"
    },
    {
      "id": "301fc430-28fa-4d08-b7dd-7c6d780ada8f",
      "fullName": "Khaled Ramadan",
      "role": "employee"
    }
  ]
}
```

## Frontend integration steps

1. On opening the "Change Owner" modal:
   - call `GET /api/v1/clients/owners/options?limit=100`
2. Fill select options from:
   - `label = fullName`
   - `value = id`
3. On submit:
   - call existing endpoint `PATCH /api/v1/clients/:clientId/owner`
   - body stays the same:

```json
{
  "newOwnerUserId": "<selected-option-id>"
}
```

## Notes

- No change in change-owner payload contract.
- Dropdown data contains only active users who can own clients (`admin`, `manager`, `employee`).
