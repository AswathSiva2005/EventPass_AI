# Student Registration API

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/events?status=published&upcoming=true` | List events accepting registration |
| `GET` | `/api/v1/colleges?active=true` | List active colleges |
| `GET` | `/api/v1/departments?college=:collegeId&active=true` | List departments in a college |
| `POST` | `/api/v1/students/register` | Create a student event registration |
| `GET` | `/api/v1/students/track/:registrationId` | Track verification and attendance state |

## Registration request

Send `multipart/form-data` with:

| Field | Type | Rules |
| --- | --- | --- |
| `event` | string | Valid MongoDB event ID with open registration |
| `name` | string | 2–120 characters |
| `rollNumber` | string | 2–50 characters; normalized to uppercase |
| `college` | string | Active college ID |
| `department` | string | Active department belonging to the selected college |
| `year` | number | Integer from 1 through 8 |
| `phone` | string | International-format phone |
| `email` | string | Valid normalized email |
| `emergencyContact[name]` | string | Emergency contact name |
| `emergencyContact[relationship]` | string | Relationship |
| `emergencyContact[phone]` | string | International-format phone |
| `selfie` | image | One JPEG, PNG, or WebP |
| `idFront` | image | College ID front |
| `idBack` | image | College ID back |

Each image must stay within `MAX_UPLOAD_SIZE_MB`. All three images are required.

## Registration identifier

Identifiers use:

```text
{COLLEGE_CODE}{EVENT_YEAR}{EVENT_CODE}{SIX_DIGIT_SEQUENCE}
```

For college `KEC`, an event in 2026 with code `EV`, and sequence 1:

```text
KEC2026EV000001
```

The sequence is allocated through an atomic MongoDB counter scoped to college, event year, and event code. Gaps are permitted if an allocated workflow later fails; IDs are never reused.

## Duplicate and capacity protection

Before uploads begin, registration checks existing records for the same event and:

- normalized email;
- normalized phone;
- uppercase roll number.

MongoDB compound unique indexes enforce the same constraints under concurrent requests. The generated registration ID, QR payload, and barcode payload are also uniquely indexed.

An event slot is reserved with an atomic capacity update. Failed workflows release the slot. Successful registrations retain it.

## Media and pass generation

The service uploads:

- selfie;
- college ID front;
- college ID back;
- generated QR image;
- generated Code 128 barcode.

Assets are stored under:

```text
eventpass-ai/registrations/{REGISTRATION_ID}
```

The QR payload contains the registration ID and an HMAC signature using `QR_SIGNING_SECRET`. This allows a scanner workflow to reject fabricated QR values. Cloudinary URLs and public IDs are stored in MongoDB for retrieval and controlled deletion.

If registration persistence fails, all newly uploaded Cloudinary assets are removed. Images are not written to the backend filesystem.

## Successful response

The HTTP `201` response contains:

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "registrationId": "KEC2026EV000001",
    "eventName": "Event name",
    "studentName": "Student name",
    "verificationStatus": "pending",
    "qrCode": {
      "imageUrl": "https://res.cloudinary.com/..."
    },
    "confirmationEmailSent": true
  }
}
```

The record is already safely stored when this response is returned. If SMTP delivery fails, `confirmationEmailSent` is `false`; the registration remains valid and is not duplicated by asking the student to resubmit.

## Email

The confirmation message includes the event name, registration ID, pending verification state, and Cloudinary QR image. Real SMTP configuration is required. No registration email or QR content is printed to server logs.
