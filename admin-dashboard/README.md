# EventPass AI Admin Dashboard

Protected React dashboard for event administrators.

## Run

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5174`. The backend must be running and `VITE_API_URL` must target its `/api/v1` URL.

The dashboard uses a verified Admin account. It does not ship default credentials.

## Features

- live visitor and registration metrics;
- seven-day and college registration charts;
- searchable/filterable registration queue;
- approval and rejection with audit logs;
- Excel and PDF exports using active filters;
- event creation, registration window, capacity, and venue assignment;
- responsive sidebar and dark mode;
- JWT refresh and remembered login support.

## Quality

```powershell
npm run lint
npm run build
```
