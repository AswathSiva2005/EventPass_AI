# EventPass AI Student Website

Responsive React and Tailwind website for discovering events, submitting verified student registrations, receiving digital passes, and tracking status.

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Vite listens on the local network as well, so another device on the same network can use the computer's LAN IP and port `5173` when Windows Firewall permits Node.js.

## Configuration

`VITE_API_URL` must point to the public versioned backend API:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Only public configuration belongs in a Vite environment variable. Never put MongoDB, JWT, Cloudinary, or other secrets in this frontend.

## Expected API contract

The website consumes real data from:

```text
GET  /events?status=published&upcoming=true
GET  /colleges?active=true
GET  /departments?college=:collegeId&active=true
POST /students/register
GET  /students/track/:registrationId
POST /contact
```

Phase 4 provides the complete client. These business endpoints must be implemented in the relevant backend phase before registration, tracking, and contact submission can complete.

## Quality commands

```powershell
npm run lint
npm run build
npm run preview
```

For Vercel, set the root directory to `frontend`, build command to `npm run build`, output directory to `dist`, and configure `VITE_API_URL` for the deployed backend.
