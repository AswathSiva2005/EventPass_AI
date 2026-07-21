# EventPass Volunteer Mobile

Expo app for volunteer check-in and attendance handling.

## Features

- Secure volunteer login
- Dashboard with summary cards
- Student search by registration ID
- QR and barcode scanning
- Student details view
- Entry and exit attendance actions
- Offline cache of recent lookups and local attendance actions
- Bottom navigation and animated UI

## Backend contract used

- `POST /api/v1/auth/login` with `userModel: "Volunteer"`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/students/track/:registrationId`

The current backend does not expose volunteer attendance mutation routes yet, so entry/exit actions are cached locally and shown in the app as offline activity until those APIs are added.

## Run

```powershell
cd volunteer-mobile-app
npm install
npm run start
```

While Expo is running, press `w` in the terminal to open the web build, or run:

```powershell
npm run web
```

Set `EXPO_PUBLIC_API_URL` to your backend base URL, for example:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
```
