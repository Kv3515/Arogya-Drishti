# Arogya Drishti — OpenAPI 3.1 Specification

**Version:** 1.0.0
**Last Updated:** 2026-03-27
**Status:** Production Contract
**Platform:** Military/Paramilitary Medical Intelligence (300K+ personnel)

---

## Table of Contents

1. [Global Specifications](#global-specifications)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Individuals Endpoints](#individuals-endpoints)
4. [Medical History Endpoints](#medical-history-endpoints)
5. [Vitals Endpoints](#vitals-endpoints)
6. [Injuries Endpoints](#injuries-endpoints)
7. [Prescriptions Endpoints](#prescriptions-endpoints)
8. [Annual Exam Endpoints](#annual-exam-endpoints)
9. [Analytics Endpoints](#analytics-endpoints)
10. [Admin Endpoints](#admin-endpoints)
11. [System Endpoints](#system-endpoints)
12. [Error Handling](#error-handling)
13. [Rate Limiting](#rate-limiting)

---

## Global Specifications

### Base URL
```
https://api.arogyadrishti.mil/v1
```

### Authentication Methods

**Access Token (JWT Bearer)**
- Location: `Authorization` header
- Format: `Authorization: Bearer <accessToken>`
- Expiry: 15 minutes
- Refresh: via `/auth/refresh` endpoint

**Refresh Token**
- Location: `httpOnly` cookie (name: `refreshToken`)
- Expiry: 30 days
- Cannot be accessed by JavaScript; secure transport only

### Standard Response Envelopes

#### Success Response (2xx)
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

#### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional context"
  },
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Pagination Envelope
```json
{
  "success": true,
  "data": [
    { /* item */ }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25,
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Standard Status Codes
- `200 OK` — Success
- `201 Created` — Resource created
- `204 No Content` — Success with no response body
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Missing/invalid auth
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Duplicate/state conflict
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Server error

### Common Query Parameters

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| `page` | integer | `1` | Default: 1; min: 1 |
| `limit` | integer | `50` | Default: 50; max: 500 |
| `sort` | string | `createdAt:desc` | Format: `field:asc\|desc` |
| `search` | string | `Sharma` | Full-text search (varies by endpoint) |

---

## Authentication Endpoints

### POST /auth/login

**Purpose:** Authenticate user and obtain tokens

| Aspect | Details |
|--------|---------|
| **Auth Required** | No |
| **Rate Limit** | 5 req/15min per IP |
| **Audit Logged** | Yes (`LOGIN_SUCCESS`, `LOGIN_FAILURE`) |

**Request Body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | Yes | Email or service number |
| `password` | string | Yes | Min 8 chars |
| `deviceId` | string | No | For device tracking |

**Response (201 Created)**

| Field | Type | Notes |
|-------|------|-------|
| `accessToken` | string | JWT; 15 min expiry |
| `refreshToken` | string | Sent via httpOnly cookie; 30 day expiry |
| `user` | object | User profile object (see below) |
| `expiresIn` | integer | Access token TTL in seconds (900) |

**User Profile Object**

| Field | Type |
|-------|------|
| `id` | string (UUID) |
| `username` | string |
| `email` | string |
| `firstName` | string |
| `lastName` | string |
| `role` | enum: `super_admin`, `admin`, `doctor`, `nurse`, `unit_commander` |
| `unitId` | string (UUID) |
| `isActive` | boolean |
| `lastLoginAt` | ISO 8601 datetime |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `INVALID_CREDENTIALS` | 401 | Username or password is incorrect |
| `ACCOUNT_DISABLED` | 403 | User account is inactive |
| `ACCOUNT_LOCKED` | 429 | Too many failed login attempts |
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dr.sharma@military.mil",
    "password": "SecurePass123",
    "deviceId": "device_iphone_001"
  }' \
  -c cookies.txt

# Response headers include: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

---

### POST /auth/refresh

**Purpose:** Obtain new access token using refresh token

| Aspect | Details |
|--------|---------|
| **Auth Required** | No (uses refresh token cookie) |
| **Rate Limit** | 10 req/15min per IP |
| **Audit Logged** | Yes (`TOKEN_REFRESH`) |

**Request**

- No request body required
- Refresh token must be in httpOnly cookie `refreshToken`

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `accessToken` | string | New JWT; 15 min expiry |
| `expiresIn` | integer | 900 (seconds) |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `INVALID_REFRESH_TOKEN` | 401 | Token missing, expired, or invalid |
| `TOKEN_REVOKED` | 401 | Refresh token has been revoked |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/auth/refresh \
  -b cookies.txt

# Response: { accessToken: "eyJ...", expiresIn: 900 }
```

---

### POST /auth/logout

**Purpose:** Revoke refresh token and invalidate session

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes (Bearer token) |
| **Required Role** | Any authenticated role |
| **Rate Limit** | None |
| **Audit Logged** | Yes (`LOGOUT`) |

**Request**

- No request body
- Refresh token in cookie `refreshToken`

**Response (204 No Content)**

- No response body
- Browser should clear refreshToken cookie

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid access token |
| `REFRESH_TOKEN_NOT_FOUND` | 400 | No refresh token in request |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/auth/logout \
  -H "Authorization: Bearer eyJ..." \
  -b cookies.txt
```

---

## Individuals Endpoints

### GET /individuals

**Purpose:** List individuals with pagination and filters

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Query Parameters**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | 1 | Min: 1 |
| `limit` | integer | 50 | Max: 500 |
| `unitId` | string | — | Filter by unit UUID |
| `search` | string | — | Search by name, service #, email |
| `isActive` | boolean | true | Filter by active status |
| `sort` | string | `lastName:asc` | Sortable: `lastName`, `firstName`, `createdAt`, `serviceNumber` |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | Individual record ID |
| `serviceNumber` | string | Unique ID (e.g., "MIL123456") |
| `firstName` | string | |
| `lastName` | string | |
| `email` | string | |
| `dateOfBirth` | ISO 8601 date | |
| `gender` | enum: `M`, `F`, `Other` | |
| `unitId` | string (UUID) | |
| `unitName` | string | Denormalized from units table |
| `rank` | string | Military rank |
| `designation` | string | Job title |
| `bloodGroup` | enum: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` | |
| `medicalStatus` | enum: `FIT`, `TEMPORARILY_UNFIT`, `PERMANENTLY_UNFIT` | Current status |
| `isActive` | boolean | |
| `createdAt` | ISO 8601 datetime | |
| `updatedAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Invalid or missing auth token |
| `FORBIDDEN` | 403 | User cannot list individuals in other units |
| `INVALID_QUERY` | 400 | Bad pagination or filter parameters |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/individuals?unitId=unit_xyz&page=1&limit=50&sort=lastName:asc" \
  -H "Authorization: Bearer eyJ..."
```

---

### POST /individuals

**Purpose:** Create new individual record

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_INDIVIDUAL`) |

**Request Body**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `serviceNumber` | string | Yes | Unique, alphanumeric, max 20 chars |
| `firstName` | string | Yes | Max 100 chars |
| `lastName` | string | Yes | Max 100 chars |
| `email` | string | Yes | Valid email; unique |
| `dateOfBirth` | ISO 8601 date | Yes | Cannot be future date |
| `gender` | enum | Yes | `M`, `F`, `Other` |
| `unitId` | string (UUID) | Yes | Must exist in units table |
| `rank` | string | No | Max 50 chars |
| `designation` | string | No | Max 100 chars |
| `bloodGroup` | enum | Yes | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `medicalStatus` | enum | No | Default: `FIT` |
| `emergencyContact` | object | No | `name` (string), `phone` (string), `relation` (string) |

**Response (201 Created)**

Returns created individual object (same structure as GET /individuals list item).

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions (not super_admin) |
| `VALIDATION_ERROR` | 400 | Missing/invalid fields |
| `DUPLICATE_SERVICE_NUMBER` | 409 | Service number already exists |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `UNIT_NOT_FOUND` | 404 | Unit UUID doesn't exist |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/individuals \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "serviceNumber": "MIL123456",
    "firstName": "Rajesh",
    "lastName": "Sharma",
    "email": "rajesh.sharma@military.mil",
    "dateOfBirth": "1990-05-15",
    "gender": "M",
    "unitId": "unit_xyz",
    "rank": "Captain",
    "designation": "Field Officer",
    "bloodGroup": "O+",
    "emergencyContact": {
      "name": "Priya Sharma",
      "phone": "+91-9876543210",
      "relation": "Spouse"
    }
  }'
```

---

### GET /individuals/:serviceNumber

**Purpose:** Retrieve full individual profile

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `serviceNumber` | string | URL-encoded service number |

**Response (200 OK)**

Individual object with extended fields:

| Field | Type | Notes |
|-------|------|-------|
| (all fields from list endpoint) | — | |
| `emergencyContact` | object | `name`, `phone`, `relation` |
| `medicalSummary` | object | Last 3 months snapshot |
| `medicalSummary.lastVisitDate` | ISO 8601 datetime | |
| `medicalSummary.lastVisitType` | string | |
| `medicalSummary.activeInjuries` | integer | Count |
| `medicalSummary.activePrescriptions` | integer | Count |
| `medicalSummary.lastVitalsDate` | ISO 8601 datetime | |
| `documents` | array | Array of `{ id, type, url, uploadedAt }` |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | User not authorized to view this individual |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |

**Example**

```bash
curl -X GET https://api.arogyadrishti.mil/v1/individuals/MIL123456 \
  -H "Authorization: Bearer eyJ..."
```

---

### PUT /individuals/:serviceNumber

**Purpose:** Update individual profile

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `unit_commander` (own unit) |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`UPDATE_INDIVIDUAL`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Request Body** (all optional)

| Field | Type | Validation |
|-------|------|-----------|
| `email` | string | Valid email; must be unique if changed |
| `rank` | string | Max 50 chars |
| `designation` | string | Max 100 chars |
| `bloodGroup` | enum | See POST /individuals |
| `medicalStatus` | enum | `FIT`, `TEMPORARILY_UNFIT`, `PERMANENTLY_UNFIT` |
| `emergencyContact` | object | `name`, `phone`, `relation` |

**Response (200 OK)**

Updated individual object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Cannot update individuals outside your unit |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid field values |
| `DUPLICATE_EMAIL` | 409 | Email already registered |

**Example**

```bash
curl -X PUT https://api.arogyadrishti.mil/v1/individuals/MIL123456 \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "medicalStatus": "TEMPORARILY_UNFIT",
    "rank": "Major"
  }'
```

---

### DELETE /individuals/:serviceNumber

**Purpose:** Soft delete individual record (sets is_active=false)

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`DELETE_INDIVIDUAL`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Response (204 No Content)**

No response body. Record marked inactive.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |

---

## Medical History Endpoints

### GET /individuals/:serviceNumber/medical-history

**Purpose:** Retrieve paginated medical history with optional filters

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50; max: 500 |
| `visitType` | enum | `ROUTINE`, `EMERGENCY`, `FOLLOW_UP`, `PHYSICAL_EXAM` |
| `from` | ISO 8601 date | Start date filter (inclusive) |
| `to` | ISO 8601 date | End date filter (inclusive) |
| `sort` | string | Default: `visitDate:desc` |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `serviceNumber` | string | |
| `visitDate` | ISO 8601 datetime | |
| `visitType` | enum | `ROUTINE`, `EMERGENCY`, `FOLLOW_UP`, `PHYSICAL_EXAM` |
| `chiefComplaint` | string | Primary symptom/reason |
| `diagnosis` | string | Clinical diagnosis |
| `icd10Code` | string | ICD-10 diagnosis code (e.g., "I10") |
| `notes` | string | Doctor's clinical notes |
| `doctorId` | string (UUID) | Treating physician |
| `doctorName` | string | Denormalized |
| `prescriptionCount` | integer | Number of prescriptions issued |
| `createdAt` | ISO 8601 datetime | |
| `updatedAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `INVALID_QUERY` | 400 | Bad date format or invalid visitType |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/individuals/MIL123456/medical-history?visitType=ROUTINE&from=2026-01-01&to=2026-03-27&page=1&limit=50" \
  -H "Authorization: Bearer eyJ..."
```

---

### POST /individuals/:serviceNumber/medical-history

**Purpose:** Create new medical history entry

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_MEDICAL_RECORD`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Request Body**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `visitDate` | ISO 8601 datetime | Yes | Cannot be future |
| `visitType` | enum | Yes | `ROUTINE`, `EMERGENCY`, `FOLLOW_UP`, `PHYSICAL_EXAM` |
| `chiefComplaint` | string | Yes | Max 500 chars |
| `diagnosis` | string | Yes | Max 1000 chars |
| `icd10Code` | string | Yes | Valid ICD-10 code |
| `notes` | string | No | Max 5000 chars |
| `prescriptions` | array | No | Array of prescription objects (see Prescriptions section) |
| `vitals` | object | No | Blood pressure, heart rate, etc. (see Vitals section) |

**Response (201 Created)**

Created medical history entry object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can create records |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid ICD-10 code or missing fields |
| `INVALID_ICD10` | 400 | ICD-10 code not recognized |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/individuals/MIL123456/medical-history \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "visitDate": "2026-03-27T14:30:00Z",
    "visitType": "ROUTINE",
    "chiefComplaint": "Hypertension checkup",
    "diagnosis": "Essential hypertension, controlled",
    "icd10Code": "I10",
    "notes": "BP readings stable. Continue current medication.",
    "prescriptions": [
      {
        "medicationName": "Amlodipine",
        "dosage": "5mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "route": "Oral"
      }
    ]
  }'
```

---

### GET /individuals/:serviceNumber/medical-history/:id

**Purpose:** Retrieve single medical history entry with all prescriptions

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |
| `id` | string (UUID) |

**Response (200 OK)**

Medical history entry with nested prescriptions array:

| Field | Type | Notes |
|-------|------|-------|
| (all fields from list) | — | |
| `prescriptions` | array | Full prescription objects (see Prescriptions section) |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `MEDICAL_RECORD_NOT_FOUND` | 404 | Record doesn't exist |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |

---

### PUT /individuals/:serviceNumber/medical-history/:id

**Purpose:** Update medical history entry (notes, diagnosis only; cannot modify visit metadata)

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`UPDATE_MEDICAL_RECORD`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |
| `id` | string (UUID) |

**Request Body** (all optional)

| Field | Type | Validation |
|-------|------|-----------|
| `diagnosis` | string | Max 1000 chars |
| `icd10Code` | string | Valid ICD-10 code |
| `notes` | string | Max 5000 chars |

**Response (200 OK)**

Updated medical history entry.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can update records |
| `MEDICAL_RECORD_NOT_FOUND` | 404 | Record doesn't exist |
| `INVALID_ICD10` | 400 | ICD-10 code not recognized |

---

## Vitals Endpoints

### GET /individuals/:serviceNumber/vitals

**Purpose:** Retrieve vitals readings with optional date range

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `from` | ISO 8601 date | Start date (inclusive) |
| `to` | ISO 8601 date | End date (inclusive) |
| `limit` | integer | Default: 100; max: 500 |
| `sort` | string | Default: `recordedAt:desc` |

**Response (200 OK)**

Array of vitals readings:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `serviceNumber` | string | |
| `recordedAt` | ISO 8601 datetime | |
| `systolicBP` | integer | mmHg; range 60–250 |
| `diastolicBP` | integer | mmHg; range 40–150 |
| `heartRate` | integer | bpm; range 30–200 |
| `respiratoryRate` | integer | breaths/min; range 8–60 |
| `temperature` | number | Celsius; range 35.0–43.0 |
| `weight` | number | kg; precision 0.1 |
| `height` | number | cm; precision 0.1 |
| `bmi` | number | Auto-calculated; precision 0.1 |
| `oxygenSaturation` | integer | % SpO2; range 70–100 |
| `recordedBy` | string (UUID) | Nurse/doctor ID |
| `createdAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `INVALID_QUERY` | 400 | Bad date format |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/individuals/MIL123456/vitals?from=2026-03-01&to=2026-03-27&limit=50" \
  -H "Authorization: Bearer eyJ..."
```

---

### POST /individuals/:serviceNumber/vitals

**Purpose:** Record new vitals reading

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `nurse`, `doctor` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_VITALS`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Request Body**

| Field | Type | Required | Range |
|-------|------|----------|-------|
| `recordedAt` | ISO 8601 datetime | Yes | Cannot be future |
| `systolicBP` | integer | Yes | 60–250 mmHg |
| `diastolicBP` | integer | Yes | 40–150 mmHg |
| `heartRate` | integer | Yes | 30–200 bpm |
| `respiratoryRate` | integer | Yes | 8–60 breaths/min |
| `temperature` | number | Yes | 35.0–43.0°C |
| `weight` | number | Yes | kg; e.g., 75.5 |
| `height` | number | Yes | cm; e.g., 180.5 |
| `oxygenSaturation` | integer | Yes | 70–100% SpO2 |
| `notes` | string | No | Max 500 chars |

**Response (201 Created)**

Created vitals object (same structure as GET response item).

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only nurses/doctors can record vitals |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `VALIDATION_ERROR` | 400 | Values out of range |

**Example**

```bash
curl -X POST https://api.arogyadrishti.mil/v1/individuals/MIL123456/vitals \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "recordedAt": "2026-03-27T10:00:00Z",
    "systolicBP": 128,
    "diastolicBP": 85,
    "heartRate": 72,
    "respiratoryRate": 16,
    "temperature": 37.2,
    "weight": 75.5,
    "height": 180.5,
    "oxygenSaturation": 98,
    "notes": "Normal reading"
  }'
```

---

## Injuries Endpoints

### GET /individuals/:serviceNumber/injuries

**Purpose:** Retrieve all injuries with optional filters

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50; max: 500 |
| `status` | enum | `ACTIVE`, `HEALING`, `RECOVERED`, `PERMANENT` |
| `from` | ISO 8601 date | Injury date start |
| `to` | ISO 8601 date | Injury date end |
| `sort` | string | Default: `injuryDate:desc` |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `serviceNumber` | string | |
| `injuryDate` | ISO 8601 date | |
| `injuryType` | string | E.g., "Fracture", "Laceration", "Burn" |
| `location` | string | Body part affected |
| `severity` | enum | `MINOR`, `MODERATE`, `SEVERE` |
| `description` | string | Detailed injury description |
| `status` | enum | `ACTIVE`, `HEALING`, `RECOVERED`, `PERMANENT` |
| `estimatedRecoveryDate` | ISO 8601 date | Expected healing date |
| `doctorId` | string (UUID) | Reporting physician |
| `createdAt` | ISO 8601 datetime | |
| `updatedAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `INVALID_QUERY` | 400 | Bad date format |

---

### POST /individuals/:serviceNumber/injuries

**Purpose:** Record new injury

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_INJURY`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Request Body**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `injuryDate` | ISO 8601 date | Yes | Cannot be future |
| `injuryType` | string | Yes | Max 100 chars |
| `location` | string | Yes | Max 100 chars |
| `severity` | enum | Yes | `MINOR`, `MODERATE`, `SEVERE` |
| `description` | string | Yes | Max 2000 chars |
| `estimatedRecoveryDate` | ISO 8601 date | Yes | Must be >= injuryDate |

**Response (201 Created)**

Created injury object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can record injuries |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid dates or missing fields |

---

### PUT /individuals/:serviceNumber/injuries/:id

**Purpose:** Update injury recovery status

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`UPDATE_INJURY`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |
| `id` | string (UUID) |

**Request Body**

| Field | Type | Validation |
|-------|------|-----------|
| `status` | enum | `ACTIVE`, `HEALING`, `RECOVERED`, `PERMANENT` |
| `estimatedRecoveryDate` | ISO 8601 date | Optional; future-dated |
| `notes` | string | Optional; max 1000 chars |

**Response (200 OK)**

Updated injury object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can update injuries |
| `INJURY_NOT_FOUND` | 404 | Injury ID doesn't exist |

---

## Prescriptions Endpoints

### GET /individuals/:serviceNumber/prescriptions

**Purpose:** Retrieve active (or all) prescriptions for individual

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50; max: 500 |
| `activeOnly` | boolean | Default: true |
| `from` | ISO 8601 date | Prescription date start |
| `to` | ISO 8601 date | Prescription date end |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `serviceNumber` | string | |
| `medicationName` | string | Generic or brand name |
| `dosage` | string | E.g., "5mg", "10mL" |
| `frequency` | string | E.g., "Once daily", "Twice daily after meals" |
| `duration` | string | E.g., "30 days", "7 days" |
| `route` | enum | `Oral`, `Injection`, `Topical`, `Inhalation`, `IV` |
| `prescribedDate` | ISO 8601 datetime | |
| `startDate` | ISO 8601 date | When to start taking |
| `endDate` | ISO 8601 date | When to stop taking |
| `doctorId` | string (UUID) | Prescribing physician |
| `doctorName` | string | Denormalized |
| `medicalRecordId` | string (UUID) | Associated medical history entry |
| `isActive` | boolean | |
| `notes` | string | Special instructions |
| `createdAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/individuals/MIL123456/prescriptions?activeOnly=true&page=1" \
  -H "Authorization: Bearer eyJ..."
```

---

### PUT /prescriptions/:id/deactivate

**Purpose:** Deactivate prescription (set isActive=false)

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`DEACTIVATE_PRESCRIPTION`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `id` | string (UUID) |

**Request Body**

| Field | Type | Required |
|-------|------|----------|
| `reason` | string | Yes; max 500 chars |

**Response (200 OK)**

Updated prescription object with `isActive: false`.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can deactivate |
| `PRESCRIPTION_NOT_FOUND` | 404 | Prescription doesn't exist |
| `ALREADY_INACTIVE` | 409 | Prescription already inactive |

**Example**

```bash
curl -X PUT https://api.arogyadrishti.mil/v1/prescriptions/presc_xyz/deactivate \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"reason": "Patient developed intolerance"}'
```

---

## Annual Exam Endpoints

### GET /individuals/:serviceNumber/annual-exam

**Purpose:** Retrieve latest annual exam plus historical records

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `doctor`, `nurse` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | For history; default: 1 |
| `limit` | integer | For history; default: 50 |

**Response (200 OK)**

Object with `latest` and `history`:

```json
{
  "latest": { /* most recent annual exam */ },
  "history": [ /* paginated list */ ]
}
```

Each exam:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `serviceNumber` | string | |
| `examDate` | ISO 8601 date | |
| `examYear` | integer | E.g., 2026 |
| `overallFitness` | enum | `FIT`, `TEMPORARILY_UNFIT`, `PERMANENTLY_UNFIT` |
| `clinicalFindings` | string | Summary of findings |
| `recommendations` | string | Doctor's recommendations |
| `doctorId` | string (UUID) | Examining physician |
| `doctorName` | string | Denormalized |
| `vitalsSnapshot` | object | BP, HR, weight, BMI at exam time |
| `createdAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |

---

### POST /individuals/:serviceNumber/annual-exam

**Purpose:** Create new annual exam record

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `doctor` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_ANNUAL_EXAM`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `serviceNumber` | string |

**Request Body**

| Field | Type | Required |
|-------|------|----------|
| `examDate` | ISO 8601 date | Yes |
| `overallFitness` | enum | Yes; `FIT`, `TEMPORARILY_UNFIT`, `PERMANENTLY_UNFIT` |
| `clinicalFindings` | string | Yes; max 2000 chars |
| `recommendations` | string | Yes; max 2000 chars |
| `vitalsSnapshot` | object | Yes; BP, HR, weight, height, temp, etc. |

**Response (201 Created)**

Created annual exam object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only doctors can create exams |
| `INDIVIDUAL_NOT_FOUND` | 404 | Service number doesn't exist |
| `VALIDATION_ERROR` | 400 | Missing or invalid fields |
| `DUPLICATE_EXAM` | 409 | Exam already exists for this year/individual |

---

## Analytics Endpoints

### GET /analytics/unit/:unitId/fitness-summary

**Purpose:** Unit-level fitness status overview

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `unitId` | string (UUID) |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `unitId` | string (UUID) | |
| `unitName` | string | |
| `totalPersonnel` | integer | Active individuals |
| `fit` | integer | Count |
| `fitPercentage` | number | E.g., 75.5 |
| `temporarilyUnfit` | integer | Count |
| `temporarilyUnfitPercentage` | number | |
| `permanentlyUnfit` | integer | Count |
| `permanentlyUnfitPercentage` | number | |
| `lastUpdated` | ISO 8601 datetime | Recalculated daily at midnight |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |
| `FORBIDDEN` | 403 | Cannot view other units' analytics |

**Example**

```bash
curl -X GET https://api.arogyadrishti.mil/v1/analytics/unit/unit_xyz/fitness-summary \
  -H "Authorization: Bearer eyJ..."
```

---

### GET /analytics/unit/:unitId/disease-trends

**Purpose:** Top 10 ICD-10 diagnoses in unit during period

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `unit_commander`, `doctor` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `unitId` | string (UUID) |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `from` | ISO 8601 date | Default: 90 days ago |
| `to` | ISO 8601 date | Default: today |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `unitId` | string (UUID) | |
| `unitName` | string | |
| `period` | object | `from`, `to` |
| `top10ICD10` | array | Sorted by count descending |
| `top10ICD10[].code` | string | ICD-10 code (e.g., "I10") |
| `top10ICD10[].text` | string | Diagnosis description |
| `top10ICD10[].count` | integer | Number of cases |
| `top10ICD10[].percentage` | number | % of total diagnoses |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |
| `INVALID_QUERY` | 400 | Bad date format |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/analytics/unit/unit_xyz/disease-trends?from=2026-01-01&to=2026-03-27" \
  -H "Authorization: Bearer eyJ..."
```

---

### GET /analytics/unit/:unitId/injury-rates

**Purpose:** Monthly injury statistics by type

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `unitId` | string (UUID) |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `from` | ISO 8601 date | Default: 12 months ago |
| `to` | ISO 8601 date | Default: today |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `unitId` | string (UUID) | |
| `period` | object | `from`, `to` |
| `monthly` | array | One entry per month in period |
| `monthly[].month` | string | "2026-03" |
| `monthly[].count` | integer | Total injuries |
| `monthly[].byType` | object | `{ "Fracture": 5, "Laceration": 3, ... }` |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |

---

### GET /analytics/unit/:unitId/readiness-score

**Purpose:** Overall unit operational readiness score

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `unitId` | string (UUID) |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `unitId` | string (UUID) | |
| `unitName` | string | |
| `score` | number | 0–100 |
| `scoreLevel` | enum | `EXCELLENT` (90–100), `GOOD` (75–89), `FAIR` (60–74), `POOR` (<60) |
| `formula` | string | Human-readable calculation description |
| `breakdown` | object | Component contributions |
| `breakdown.fitnessWeight` | number | Contribution % |
| `breakdown.diseaseBurdenWeight` | number | Contribution % |
| `breakdown.injuryRateWeight` | number | Contribution % |
| `breakdown.prescriptionCoverageWeight` | number | Contribution % |
| `calculatedAt` | ISO 8601 datetime | Last recalc time |

**Example Response**

```json
{
  "unitId": "unit_xyz",
  "unitName": "Alpha Company",
  "score": 82.5,
  "scoreLevel": "GOOD",
  "formula": "(fitness_fit% × 0.35) + (disease_control × 0.25) + (injury_rate × 0.25) + (med_coverage × 0.15)",
  "breakdown": {
    "fitness": { "contribution": 29.4, "weight": 0.35 },
    "diseaseBurden": { "contribution": 20.0, "weight": 0.25 },
    "injuryRate": { "contribution": 20.0, "weight": 0.25 },
    "prescriptionCoverage": { "contribution": 13.1, "weight": 0.15 }
  },
  "calculatedAt": "2026-03-27T00:00:00Z"
}
```

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |

---

### GET /analytics/unit/:unitId/sub-units

**Purpose:** Hierarchy drill-down for sub-units and their readiness scores

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Roles** | `admin`, `unit_commander` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `unitId` | string (UUID) |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `unitId` | string (UUID) | Parent unit |
| `unitName` | string | |
| `subUnits` | array | Nested structure |
| `subUnits[].id` | string (UUID) | |
| `subUnits[].name` | string | |
| `subUnits[].personnel` | integer | Count of active individuals |
| `subUnits[].readinessScore` | number | 0–100 |
| `subUnits[].fitnessPercentage` | number | % FIT |
| `subUnits[].children` | array | Recursive nesting (up to 3 levels) |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |

---

## Admin Endpoints

### GET /users

**Purpose:** List all system users with filters

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50; max: 500 |
| `role` | enum | Filter by role |
| `unitId` | string | Filter by unit |
| `isActive` | boolean | Default: true |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `username` | string | |
| `email` | string | |
| `firstName` | string | |
| `lastName` | string | |
| `role` | enum | `super_admin`, `admin`, `doctor`, `nurse`, `unit_commander` |
| `unitId` | string (UUID) | Assigned unit |
| `unitName` | string | Denormalized |
| `isActive` | boolean | |
| `lastLoginAt` | ISO 8601 datetime | |
| `createdAt` | ISO 8601 datetime | |
| `updatedAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can view users |

---

### POST /users

**Purpose:** Create new system user

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_USER`) |

**Request Body**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `username` | string | Yes | Unique; 3–50 chars; alphanumeric + underscore |
| `email` | string | Yes | Valid email; unique |
| `firstName` | string | Yes | Max 100 chars |
| `lastName` | string | Yes | Max 100 chars |
| `password` | string | Yes | Min 12 chars; complexity rules (uppercase, lowercase, digit, symbol) |
| `role` | enum | Yes | `super_admin`, `admin`, `doctor`, `nurse`, `unit_commander` |
| `unitId` | string (UUID) | No | Required if not super_admin |

**Response (201 Created)**

Created user object (same as GET /users list item).

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can create users |
| `DUPLICATE_USERNAME` | 409 | Username already exists |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `UNIT_NOT_FOUND` | 404 | Unit UUID doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid password or fields |

---

### PUT /users/:id

**Purpose:** Update user details (password, role, active status)

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`UPDATE_USER`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `id` | string (UUID) |

**Request Body** (all optional)

| Field | Type | Validation |
|-------|------|-----------|
| `email` | string | Valid email; unique if changed |
| `firstName` | string | Max 100 chars |
| `lastName` | string | Max 100 chars |
| `role` | enum | Cannot demote super_admin |
| `unitId` | string (UUID) | Must exist |
| `isActive` | boolean | |
| `password` | string | New password; min 12 chars; complexity rules |

**Response (200 OK)**

Updated user object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can update users |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `VALIDATION_ERROR` | 400 | Invalid password or fields |

---

### DELETE /users/:id

**Purpose:** Soft delete user (sets is_active=false)

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`DELETE_USER`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `id` | string (UUID) |

**Response (204 No Content)**

No response body. User marked inactive.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can delete users |
| `USER_NOT_FOUND` | 404 | User doesn't exist |

---

### GET /units

**Purpose:** List all organizational units

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `admin`, `super_admin` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50 |
| `search` | string | Search unit name |
| `parentUnitId` | string (UUID) | Filter by parent unit |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `name` | string | |
| `code` | string | E.g., "ALPHA-01" |
| `parentUnitId` | string (UUID) | Nullable |
| `type` | enum | `COMMAND`, `COMPANY`, `PLATOON`, `SECTION` |
| `personnel` | integer | Count of active individuals |
| `location` | string | Base/station name |
| `commanderId` | string (UUID) | Assigned commander |
| `commanderName` | string | Denormalized |
| `isActive` | boolean | |
| `createdAt` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Cannot view other units |

---

### POST /units

**Purpose:** Create new organizational unit

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`CREATE_UNIT`) |

**Request Body**

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Max 100 chars |
| `code` | string | Yes | Unique; max 20 chars; alphanumeric + dash |
| `parentUnitId` | string (UUID) | No | Must exist if provided |
| `type` | enum | Yes | `COMMAND`, `COMPANY`, `PLATOON`, `SECTION` |
| `location` | string | No | Max 100 chars |
| `commanderId` | string (UUID) | No | Must be active user with appropriate role |

**Response (201 Created)**

Created unit object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can create units |
| `DUPLICATE_CODE` | 409 | Unit code already exists |
| `PARENT_UNIT_NOT_FOUND` | 404 | Parent unit doesn't exist |
| `COMMANDER_NOT_FOUND` | 404 | Commander user doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid fields |

---

### PUT /units/:id

**Purpose:** Update unit details

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin` only |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | Yes (`UPDATE_UNIT`) |

**Path Parameters**

| Parameter | Type |
|-----------|------|
| `id` | string (UUID) |

**Request Body** (all optional)

| Field | Type | Validation |
|-------|------|-----------|
| `name` | string | Max 100 chars |
| `location` | string | Max 100 chars |
| `commanderId` | string (UUID) | Must exist and be active |
| `isActive` | boolean | |

**Response (200 OK)**

Updated unit object.

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only super_admin can update units |
| `UNIT_NOT_FOUND` | 404 | Unit doesn't exist |
| `COMMANDER_NOT_FOUND` | 404 | Commander doesn't exist |

---

### GET /audit-logs

**Purpose:** Retrieve audit trail of system actions

| Aspect | Details |
|--------|---------|
| **Auth Required** | Yes |
| **Required Role** | `super_admin`, `admin` |
| **Rate Limit** | 100 req/min |
| **Audit Logged** | No (read-only) |

**Query Parameters**

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 50; max: 500 |
| `userId` | string (UUID) | Filter by actor |
| `action` | string | Filter by action (e.g., `LOGIN_SUCCESS`, `CREATE_INDIVIDUAL`) |
| `from` | ISO 8601 datetime | Start of range |
| `to` | ISO 8601 datetime | End of range |
| `resourceType` | string | Filter by resource (e.g., `INDIVIDUAL`, `PRESCRIPTION`) |
| `resourceId` | string | Filter by specific resource |

**Response (200 OK)**

Paginated list; each item:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID) | |
| `userId` | string (UUID) | User who performed action |
| `userName` | string | Denormalized |
| `action` | string | E.g., `LOGIN_SUCCESS`, `CREATE_INDIVIDUAL`, `UPDATE_MEDICAL_RECORD` |
| `resourceType` | string | E.g., `INDIVIDUAL`, `PRESCRIPTION`, `USER` |
| `resourceId` | string | ID of affected resource (nullable for login events) |
| `changes` | object | Field-by-field diff; `{ fieldName: { old: ..., new: ... } }` |
| `ipAddress` | string | Source IP |
| `userAgent` | string | Browser/client info |
| `status` | enum | `SUCCESS`, `FAILURE` |
| `errorMessage` | string | Only if status=FAILURE |
| `timestamp` | ISO 8601 datetime | |

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Only admin+ can view audit logs |

**Example**

```bash
curl -X GET "https://api.arogyadrishti.mil/v1/audit-logs?action=CREATE_INDIVIDUAL&from=2026-03-01&to=2026-03-27&page=1" \
  -H "Authorization: Bearer eyJ..."
```

---

## System Endpoints

### GET /health

**Purpose:** System health check (no auth required, useful for load balancers)

| Aspect | Details |
|--------|---------|
| **Auth Required** | No |
| **Rate Limit** | 60 req/min per IP |
| **Audit Logged** | No |

**Response (200 OK)**

| Field | Type | Notes |
|-------|------|-------|
| `status` | enum | `UP`, `DEGRADED`, `DOWN` |
| `timestamp` | ISO 8601 datetime | |
| `checks` | object | Component health |
| `checks.database` | enum | `UP`, `DOWN` |
| `checks.cache` | enum | `UP`, `DOWN` |
| `checks.queue` | enum | `UP`, `DOWN` |
| `version` | string | API version (e.g., "1.0.0") |
| `uptime` | integer | Seconds since last restart |

**Example Response**

```json
{
  "status": "UP",
  "timestamp": "2026-03-27T10:30:45Z",
  "checks": {
    "database": "UP",
    "cache": "UP",
    "queue": "UP"
  },
  "version": "1.0.0",
  "uptime": 604800
}
```

**Errors Returned**

| Code | Status | Message |
|------|--------|---------|
| `SERVICE_UNAVAILABLE` | 503 | One or more critical systems down |

**Example**

```bash
curl -X GET https://api.arogyadrishti.mil/v1/health
```

---

## Error Handling

### Standard Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Missing, expired, or invalid auth token |
| `FORBIDDEN` | 403 | User lacks required role/permissions |
| `INVALID_CREDENTIALS` | 401 | Username/password incorrect |
| `ACCOUNT_DISABLED` | 403 | User account is inactive |
| `ACCOUNT_LOCKED` | 429 | Too many failed login attempts (lockout: 15 min) |
| `VALIDATION_ERROR` | 400 | Request body/query validation failed |
| `DUPLICATE_*` | 409 | Resource already exists (service number, email, etc.) |
| `*_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `CONFLICT_*` | 409 | State conflict (e.g., cannot deactivate already-inactive prescription) |
| `INVALID_QUERY` | 400 | Bad pagination/filter parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit hit; retry after delay |
| `SERVICE_UNAVAILABLE` | 503 | Server or dependency down |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Example

```json
{
  "success": false,
  "error": "Service number already exists in the system",
  "code": "DUPLICATE_SERVICE_NUMBER",
  "details": {
    "field": "serviceNumber",
    "conflictingValue": "MIL123456"
  },
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## Rate Limiting

### Rate Limit Tiers

| Endpoint Group | Rate Limit | Scope | Applies To |
|----------------|-----------|-------|-----------|
| Auth (login, refresh) | 5 req/15 min | Per IP | Unauthenticated requests |
| Auth (logout, refresh) | 10 req/15 min | Per IP | All requests |
| All other authenticated | 100 req/min | Per user | After successful login |
| Health check | 60 req/min | Per IP | Unauthenticated |

### Rate Limit Headers

All responses include:

```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1711533045 (Unix timestamp)
```

### 429 Response Example

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 45 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retryAfter": 45
  },
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## Implementation Notes

1. **JWT Access Tokens**: Issued with 15-minute expiry; payload includes user ID, role, unit assignment.
2. **Refresh Tokens**: 30-day expiry; httpOnly cookies prevent JavaScript access; rotated on each refresh.
3. **Soft Deletes**: Users, units, individuals marked `is_active=false` are excluded from most queries by default.
4. **Audit Logging**: All state-changing operations logged with user, timestamp, resource, and field-level diffs.
5. **ICD-10 Validation**: Diagnosis codes validated against maintained ICD-10-CM reference table.
6. **Medical Status Determination**: Automatically recalculated daily; based on active injuries, permanent conditions, and doctor override.
7. **Analytics Caching**: Fitness summaries, disease trends cached and refreshed nightly at 00:00 UTC.
8. **Pagination**: Default 50 items; max 500 per request to prevent resource exhaustion.
9. **Search**: Full-text search on individuals (name, email, service number); database-level indexing required.
10. **Encryption**: Passwords bcrypt with salt factor 12; sensitive fields in transit encrypted via HTTPS TLS 1.3+.

---

**Document Version:** 1.0.0
**Last Updated:** 2026-03-27
**Approval Status:** Ready for backend implementation
