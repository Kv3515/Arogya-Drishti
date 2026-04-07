# Arogya Drishti — API Quick Reference

**Version:** 1.0.0
**Purpose:** One-page endpoint cheat sheet for developers

---

## Base URL
```
https://api.arogyadrishti.mil/v1
```

---

## Authentication

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "dr.sharma@military.mil",
  "password": "SecurePass123"
}

# Response: accessToken, refreshToken (httpOnly cookie)
# Headers: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

### Refresh Token
```bash
POST /auth/refresh
# Automatically includes refreshToken from httpOnly cookie

# Response: accessToken (new, 15 min expiry)
```

### Logout
```bash
POST /auth/logout
Authorization: Bearer {accessToken}

# Response: 204 No Content
# Revokes refresh token
```

---

## Individuals

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals` | Yes | admin, doctor, nurse, unit_commander | List with filters |
| POST | `/individuals` | Yes | super_admin | Create new |
| GET | `/individuals/:serviceNumber` | Yes | admin, doctor, nurse, unit_commander | Get profile |
| PUT | `/individuals/:serviceNumber` | Yes | admin, doctor, unit_commander | Update |
| DELETE | `/individuals/:serviceNumber` | Yes | super_admin | Soft delete |

**Query Params (GET /individuals):** `page`, `limit`, `unitId`, `search`, `isActive`, `sort`

---

## Medical History

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals/:serviceNumber/medical-history` | Yes | admin, doctor, nurse | List |
| POST | `/individuals/:serviceNumber/medical-history` | Yes | doctor | Create entry |
| GET | `/individuals/:serviceNumber/medical-history/:id` | Yes | admin, doctor, nurse | Get entry |
| PUT | `/individuals/:serviceNumber/medical-history/:id` | Yes | doctor | Update entry |

**Query Params (GET):** `page`, `limit`, `visitType`, `from`, `to`, `sort`

**Required Fields (POST):** `visitDate`, `visitType`, `chiefComplaint`, `diagnosis`, `icd10Code`

---

## Vitals

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals/:serviceNumber/vitals` | Yes | admin, doctor, nurse | List readings |
| POST | `/individuals/:serviceNumber/vitals` | Yes | nurse, doctor | Record new |

**Query Params (GET):** `from`, `to`, `limit`

**Required Fields (POST):** `recordedAt`, `systolicBP`, `diastolicBP`, `heartRate`, `respiratoryRate`, `temperature`, `weight`, `height`, `oxygenSaturation`

---

## Injuries

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals/:serviceNumber/injuries` | Yes | admin, doctor, nurse | List |
| POST | `/individuals/:serviceNumber/injuries` | Yes | doctor | Create |
| PUT | `/individuals/:serviceNumber/injuries/:id` | Yes | doctor | Update status |

**Query Params (GET):** `page`, `limit`, `status`, `from`, `to`

**Required Fields (POST):** `injuryDate`, `injuryType`, `location`, `severity`, `description`, `estimatedRecoveryDate`

---

## Prescriptions

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals/:serviceNumber/prescriptions` | Yes | admin, doctor, nurse | List (active by default) |
| PUT | `/prescriptions/:id/deactivate` | Yes | doctor | Deactivate |

**Query Params (GET):** `page`, `limit`, `activeOnly`, `from`, `to`

**Required Fields (PUT):** `reason` (for deactivation)

---

## Annual Exam

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/individuals/:serviceNumber/annual-exam` | Yes | admin, doctor, nurse | Latest + history |
| POST | `/individuals/:serviceNumber/annual-exam` | Yes | doctor | Create exam |

**Query Params (GET):** `page`, `limit` (for history)

**Required Fields (POST):** `examDate`, `overallFitness`, `clinicalFindings`, `recommendations`, `vitalsSnapshot`

---

## Analytics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/analytics/unit/:unitId/fitness-summary` | Yes | admin, unit_commander | Unit fitness % |
| GET | `/analytics/unit/:unitId/disease-trends` | Yes | admin, unit_commander, doctor | Top 10 ICD-10 codes |
| GET | `/analytics/unit/:unitId/injury-rates` | Yes | admin, unit_commander | Monthly injury count |
| GET | `/analytics/unit/:unitId/readiness-score` | Yes | admin, unit_commander | Readiness 0–100 |
| GET | `/analytics/unit/:unitId/sub-units` | Yes | admin, unit_commander | Hierarchy drill-down |

**Query Params:** `from`, `to` (date filters for trends/injury-rates)

---

## Admin

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | Yes | super_admin | List users |
| POST | `/users` | Yes | super_admin | Create user |
| PUT | `/users/:id` | Yes | super_admin | Update user |
| DELETE | `/users/:id` | Yes | super_admin | Soft delete user |
| GET | `/units` | Yes | admin, super_admin | List units |
| POST | `/units` | Yes | super_admin | Create unit |
| PUT | `/units/:id` | Yes | super_admin | Update unit |
| GET | `/audit-logs` | Yes | admin, super_admin | Audit trail |

**Query Params:** `page`, `limit`, `search`, `role`, `userId`, `action`, `from`, `to`

---

## System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | System health check |

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate, state error) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

## Error Response Format

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {
    "field": "additional info"
  },
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## Success Response Format

```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2026-03-27T10:30:45Z",
    "requestId": "req_abc123xyz"
  }
}
```

## Paginated Response Format

```json
{
  "success": true,
  "data": [ /* items */ ],
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

---

## Rate Limits

| Endpoint Group | Limit | Window | Scope |
|---|---|---|---|
| Auth (login) | 5 | 15 min | Per IP |
| Auth (refresh, logout) | 10 | 15 min | Per IP |
| All other authenticated | 100 | 1 min | Per user |
| Health check | 60 | 1 min | Per IP |

**Response Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 87
RateLimit-Reset: 1711533045 (Unix timestamp)
```

---

## Role Hierarchy & Permissions

### Roles
- **super_admin** — Full system access
- **admin** — Unit-level admin
- **doctor** — Medical records
- **nurse** — Vitals + support
- **unit_commander** — Analytics + personnel

### Access Scope
- **super_admin:** All units, all operations
- **admin:** Own unit + audit logs
- **doctor:** Own unit medical records
- **nurse:** Own unit vitals
- **unit_commander:** Own unit analytics

---

## Common Query Patterns

### Get individual by service number
```bash
GET /individuals/MIL123456 \
  -H "Authorization: Bearer {token}"
```

### List medical history for past 90 days
```bash
GET /individuals/MIL123456/medical-history?from=2025-12-27&to=2026-03-27&limit=50 \
  -H "Authorization: Bearer {token}"
```

### Get unit fitness status
```bash
GET /analytics/unit/unit_xyz/fitness-summary \
  -H "Authorization: Bearer {token}"
```

### Create medical record with prescription
```bash
POST /individuals/MIL123456/medical-history \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "visitDate": "2026-03-27T14:30:00Z",
    "visitType": "ROUTINE",
    "chiefComplaint": "Blood pressure check",
    "diagnosis": "Essential hypertension, controlled",
    "icd10Code": "I10",
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

### Record vitals
```bash
POST /individuals/MIL123456/vitals \
  -H "Authorization: Bearer {token}" \
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
    "oxygenSaturation": 98
  }'
```

### Deactivate prescription
```bash
PUT /prescriptions/presc_xyz/deactivate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Patient developed intolerance"}'
```

---

## Testing Endpoints (curl examples)

### Login
```bash
curl -X POST https://api.arogyadrishti.mil/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"dr.sharma@military.mil","password":"SecurePass123"}' \
  -c cookies.txt
```

### Refresh token
```bash
curl -X POST https://api.arogyadrishti.mil/v1/auth/refresh \
  -b cookies.txt
```

### Get individual
```bash
curl -X GET https://api.arogyadrishti.mil/v1/individuals/MIL123456 \
  -H "Authorization: Bearer {accessToken}"
```

### Get fitness summary
```bash
curl -X GET https://api.arogyadrishti.mil/v1/analytics/unit/unit_xyz/fitness-summary \
  -H "Authorization: Bearer {accessToken}"
```

### Health check (no auth)
```bash
curl -X GET https://api.arogyadrishti.mil/v1/health
```

---

## Implementation Checklist

- [ ] All endpoints return standard response envelope
- [ ] All state-changing ops logged to audit_logs
- [ ] Authorization checks on all protected endpoints
- [ ] Input validation on all POST/PUT requests
- [ ] ICD-10 codes validated against reference table
- [ ] Rate limiting enforced at API gateway
- [ ] Refresh tokens stored as httpOnly cookies
- [ ] Pagination limits enforced (max 500 items)
- [ ] Soft deletes preserve historical data
- [ ] Analytics materialized views refresh nightly
- [ ] Medical status auto-calculated from records
- [ ] BMI auto-calculated from weight/height
- [ ] Error codes consistent across endpoints
- [ ] Request IDs tracked for tracing
- [ ] Database transactions protect audit integrity

---

**Document Version:** 1.0.0
**Last Updated:** 2026-03-27
**For:** API developers, QA, integration teams
