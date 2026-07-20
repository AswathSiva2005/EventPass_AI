# EventPass AI Backend

Production-oriented REST API foundation for the EventPass AI college event visitor management platform. Phase 2 provides infrastructure only; business modules are intentionally deferred until their requirements are defined.

## Stack

- Node.js 20+ and Express 5
- TypeScript with strict compiler settings
- MongoDB Atlas and Mongoose
- JWT access-token authentication
- Multer in-memory image intake
- Cloudinary media storage
- Express Validator request validation

## Architecture

```text
backend/
├── src/
│   ├── config/       Environment, MongoDB, and Cloudinary configuration
│   ├── controllers/  HTTP request/response orchestration
│   ├── middlewares/  Authentication, authorization, validation, upload, and errors
│   ├── models/       Domain persistence models (added with business modules)
│   ├── routes/       Versioned REST route composition
│   ├── services/     Infrastructure and application services
│   ├── types/        TypeScript declaration extensions
│   ├── utils/        Errors, logging, async, and response helpers
│   ├── validators/   Reusable request validation chains
│   ├── app.ts        Express composition
│   └── server.ts     Database lifecycle and HTTP server startup
├── .env.example
├── eslint.config.mjs
├── package.json
└── tsconfig.json
```

Future business features should be grouped by their controller, model, route, service, and validator responsibilities without placing domain rules in route handlers.

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and replace every example credential with real development credentials. Never commit `.env`.
4. In MongoDB Atlas, allow the development machine's IP and create a least-privilege database user.
5. Run `npm run dev`.

The API defaults to `http://localhost:5000/api/v1`. Readiness is available from `GET /api/v1/health`, returning HTTP `200` when MongoDB is connected and `503` otherwise.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | HTTP listening port |
| `API_PREFIX` | Versioned base route |
| `MONGODB_URI` | MongoDB Atlas connection URI |
| `JWT_ACCESS_SECRET` | High-entropy access-token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime, such as `15m` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | JWT trust boundaries |
| `CORS_ORIGINS` | Comma-separated allowed website/dashboard origins |
| `CLOUDINARY_*` | Cloudinary account credentials |
| `MAX_UPLOAD_SIZE_MB` | Maximum image size accepted by Multer |
| `RATE_LIMIT_*` | API request-rate window and maximum |

Configuration is validated during startup, so missing required values fail fast.

## Infrastructure

`authenticate` verifies bearer tokens and exposes identity at `request.auth`; `authorize(...roles)` enforces route roles. `imageUpload` accepts one JPEG, PNG, or WebP image in memory and passes it to the Cloudinary service. Routes must explicitly opt in. Login, accounts, and all domain workflows remain outside this phase.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

For Render, configure environment variables in secret storage, use HTTPS CORS origins, and run `npm run build` followed by `npm start`.

## Database design

The complete collection design, constraints, indexes, and Mermaid entity relationship diagram are documented in [`docs/database-schema.md`](docs/database-schema.md).

## Authentication

Admin and Volunteer authentication, rotating refresh sessions, OTP flows, password reset, email verification, and role middleware are documented in [`docs/authentication.md`](docs/authentication.md).

## Student registration

Unique registration IDs, duplicate protection, signed QR/barcode generation, Cloudinary identity uploads, confirmation email, public event/reference reads, and tracking are documented in [`docs/student-registration.md`](docs/student-registration.md).

## Admin operations

Live dashboard analytics, registration review, event/venue creation, filters, and Excel/PDF exports are documented in [`docs/admin-dashboard.md`](docs/admin-dashboard.md).
