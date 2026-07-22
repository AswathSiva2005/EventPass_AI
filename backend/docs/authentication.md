# EventPass AI Authentication

## Security model

Authentication supports `Admin` and `Volunteer` accounts.

- Access tokens are short-lived JWTs signed with `JWT_ACCESS_SECRET`.
- Refresh tokens are JWTs signed with a separate secret and rotated after every use.
- Only SHA-256 refresh-token hashes are stored in `authsessions`.
- Reuse of a revoked or mismatched refresh token revokes every active session for that account.
- `rememberLogin: false` uses the standard refresh lifetime; `true` uses the longer remembered lifetime.
- Passwords are one-way hashed with bcrypt. Plaintext passwords are never persisted.
- Six-digit OTPs are HMAC-hashed with a separate pepper and expire through a MongoDB TTL index.
- OTP attempts are limited, older challenges are invalidated, and successful challenges are single-use.
- Password-reset action JWTs use a third signing secret and short lifetime.
- Password reset revokes all existing sessions.
- Login and OTP routes have dedicated rate limits.
- Login errors do not reveal whether the account identifier or password was incorrect.
- OTP requests return the same response for missing and existing accounts.

## Endpoints

All routes use the `/api/v1/auth` prefix.

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/login` | Public, rate limited | Admin or Volunteer login |
| `POST` | `/volunteer/register` | Public, rate limited | Create a phone-based volunteer account and session |
| `POST` | `/refresh` | Refresh token | Rotate session and issue new tokens |
| `POST` | `/logout` | Refresh token | Revoke one refresh session |
| `POST` | `/otp/request` | Public, rate limited | Request password-reset or email-verification OTP |
| `POST` | `/otp/verify` | Public, rate limited | Consume OTP and verify email or issue reset action token |
| `POST` | `/password/reset` | Action token, rate limited | Set a new password and revoke sessions |
| `GET` | `/me` | Bearer access token | Retrieve the authenticated account |
| `GET` | `/sessions` | Bearer access token | List active remembered and standard sessions |
| `DELETE` | `/sessions/:sessionId` | Bearer access token | Revoke a selected session |
| `POST` | `/logout-all` | Bearer access token | Revoke every account session |

## Request shapes

Login:

```json
{
  "email": "account@example.edu",
  "password": "the-account-password",
  "userModel": "Admin",
  "rememberLogin": true
}
```

`userModel` must be `Admin` or `Volunteer`. Admin login uses `email`; volunteer login uses a unique `phone`:

```json
{
  "phone": "+919876543210",
  "password": "StrongPassword!1",
  "userModel": "Volunteer",
  "rememberLogin": true
}
```

Volunteer self-registration creates an active account and immediately returns the same access/refresh session shape as login:

```json
{
  "name": "Volunteer Name",
  "phone": "+919876543210",
  "password": "StrongPassword!1",
  "rememberLogin": true
}
```

Phone numbers use international format and are unique. Volunteer registration passwords must be 8–128 characters and contain uppercase, lowercase, numeric, and special characters. Store access tokens in application memory where possible. Volunteer mobile clients should store refresh tokens in Expo Secure Store. Browser clients should avoid local storage for tokens.

Request an OTP:

```json
{
  "email": "account@example.edu",
  "userModel": "Volunteer",
  "purpose": "email_verification"
}
```

`purpose` may be `email_verification` or `forgot_password`.

Verify an OTP:

```json
{
  "email": "account@example.edu",
  "userModel": "Volunteer",
  "purpose": "forgot_password",
  "code": "123456"
}
```

Forgot-password verification returns a short-lived `actionToken`. Submit it with a compliant new password:

```json
{
  "actionToken": "short-lived-action-token",
  "newPassword": "a-strong-new-password"
}
```

Passwords must contain uppercase, lowercase, numeric, and special characters and be 12–128 characters long.

## Role protection

Use middleware after `authenticate`:

```ts
router.get("/admin-only", authenticate, authorizeUserModels("Admin"), controller);
router.get("/super-admin", authenticate, authorize("super_admin"), controller);
router.get(
  "/event-team",
  authenticate,
  authorize("admin", "event_manager", "volunteer"),
  controller
);
```

`request.auth` contains the authenticated `userId`, detailed `role`, `userModel`, and session ID.

## SMTP

OTP delivery requires a real SMTP provider. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. OTP values are never returned by the API or written to logs.

For port `465`, use `SMTP_SECURE=true`. For STARTTLS on port `587`, use `SMTP_SECURE=false`.

## Account provisioning

Create the first super admin once:

```powershell
npm run bootstrap:admin
```

The command prompts locally for name, email, and a masked strong password. It hashes the password, verifies the bootstrap email, and refuses to run when a super admin already exists. No password is placed in command history or source code.

Subsequent Admin and Volunteer records should be provisioned through authorized management workflows with `hashPassword`, followed by email verification. The project never ships a known default password.
