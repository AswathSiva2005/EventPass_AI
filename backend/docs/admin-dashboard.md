# Admin Dashboard API

All endpoints require a valid Admin bearer access token.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/admin/dashboard` | Operational totals and chart datasets |
| `GET` | `/api/v1/admin/registrations` | Paginated search and filters |
| `PATCH` | `/api/v1/admin/registrations/:studentId/verification` | Approve or reject a registration |
| `GET` | `/api/v1/admin/events` | List all events |
| `POST` | `/api/v1/admin/events` | Create an event and assign its venue |
| `GET` | `/api/v1/admin/exports/registrations.xlsx` | Download filtered Excel workbook |
| `GET` | `/api/v1/admin/exports/registrations.pdf` | Download filtered PDF report |

## Dashboard totals

The statistics response calculates:

- visitors with an entry timestamp today;
- all registrations;
- visitors currently checked in;
- visitors checked out;
- pending and rejected verification;
- active colleges and departments;
- seven-day registration trend;
- top-college registration distribution.

All figures are derived from MongoDB at request time. No dashboard metric is hardcoded.

## Registration search

Supported query parameters:

```text
search
event
college
department
verificationStatus
attendanceStatus
dateFrom
dateTo
page
limit
```

Search matches registration ID, student name, roll number, email, and phone. Query limits are capped at 100 records per page.

## Verification decisions

```json
{
  "status": "approved",
  "notes": "Identity documents verified"
}
```

`status` must be `approved` or `rejected`. Every decision stores the responsible Admin and timestamp, creates an immutable audit entry, and creates a student notification.

## Event creation

Event creation validates the college, confirms every selected department belongs to that college, validates the registration/event date sequence through Mongoose, and prevents duplicate event codes.

Venue name and address are required. Coordinates remain optional.

## Exports

Excel and PDF exports use the same filters as the registration list and are capped at 50,000 records per request. The Excel workbook includes a frozen styled header and autofilter. The PDF contains generated time, record count, and registration summaries.

The ExcelJS transitive UUID dependency is pinned through a package override to a patched release. `npm audit` reports no known vulnerabilities.
