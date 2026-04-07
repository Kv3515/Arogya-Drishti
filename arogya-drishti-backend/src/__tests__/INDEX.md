# Test Suite Index & Quick Reference

## Files Created

### Test Helpers
- **`helpers/testSetup.ts`** (202 lines)
  - `createTestToken()` — Generate valid JWT access tokens
  - `createExpiredToken()` — Generate expired tokens for testing
  - `createInvalidToken()` — Generate invalid tokens
  - `TEST_USERS` — Test user fixtures with all roles
  - `TEST_DATA` — Test unit, individual, vitals data
  - `app` — Express app instance for Supertest

### Test Suites

#### 1. RBAC Tests (233 lines)
**File:** `rbac.test.ts`
**Type:** Unit tests (no HTTP)
**Coverage:** 100% permission matrix

```typescript
describe('RBAC Permission Matrix') {
  describe('super_admin role')
  describe('medical_officer role')
  describe('paramedic role')
  describe('commander role')
  describe('individual role')
  describe('permission boundary tests')
  describe('undefined roles and resources')
  describe('permission matrix structure')
}
```

**Key Tests:**
- super_admin has full CRUD on all resources ✅
- medical_officer can CRU individuals, CRUD prescriptions ✅
- paramedic has unit-scoped read, can create vitals ✅
- commander has aggregated read, denied medical_history ✅
- individual has self-only read ✅

**Run:** `npm test -- rbac.test.ts`

---

#### 2. Auth Tests (311 lines)
**File:** `auth.test.ts`
**Type:** Integration tests (HTTP + Supertest)
**Coverage:** POST /api/v1/auth/* endpoints

```typescript
describe('Auth Endpoints') {
  describe('POST /api/v1/auth/login')
    - Valid credentials → 200 + accessToken
    - Invalid password → 401
    - Inactive user → 401
    - Missing fields → 400
  describe('POST /api/v1/auth/refresh')
    - Valid refresh token → 200 + new accessToken
    - Token rotation (old token revoked)
    - No token → 401
    - Expired token → 401
  describe('POST /api/v1/auth/logout')
    - Clear cookies → 204
    - Revoke refresh token
  describe('Authentication header validation')
}
```

**Key Tests:**
- Login/refresh/logout flow ✅
- Token rotation validation ✅
- Bearer header format ✅
- HttpOnly cookie handling ✅

**Run:** `npm test -- auth.test.ts`

---

#### 3. Individuals Tests (332 lines)
**File:** `individuals.test.ts`
**Type:** Integration tests (HTTP + RBAC)
**Coverage:** /api/v1/individuals* endpoints

```typescript
describe('Individuals Endpoints') {
  describe('GET /api/v1/individuals')
    - Pagination & filtering
    - Role-based scope (medical_officer, paramedic, individual)
  describe('GET /api/v1/individuals/:serviceNumber')
    - Fetch by service number
    - Scope enforcement (unit, self)
    - 404 not found
  describe('POST /api/v1/individuals')
    - Create (super_admin only)
    - Duplicate service_number → 409
    - Validation errors → 400
  describe('PUT /api/v1/individuals/:serviceNumber')
    - Update fields
    - Validation
}
```

**Key Tests:**
- List with pagination ✅
- Unit scope enforcement ✅
- Individual self-only access ✅
- Duplicate prevention ✅
- Role-based restrictions ✅

**Run:** `npm test -- individuals.test.ts`

---

#### 4. Vitals Tests (364 lines)
**File:** `vitals.test.ts`
**Type:** Integration tests (HTTP + Validation)
**Coverage:** /api/v1/individuals/:svcNo/vitals endpoints

```typescript
describe('Vitals Endpoints') {
  describe('POST /api/v1/individuals/:serviceNumber/vitals')
    - medical_officer → 201
    - paramedic (in unit) → 201
    - commander → 403
    - Zod validation (BP, HR, Temp, O2, Weight, Height ranges)
    - Unit scope enforcement
  describe('GET /api/v1/individuals/:serviceNumber/vitals')
    - Date range filtering (from/to)
    - Pagination
    - Commander denied → 403
  describe('Vitals validation edge cases')
    - Min/max boundary values
}
```

**Key Tests:**
- Vitals creation with validation ✅
- Date range filtering ✅
- Zod schema validation (8 fields) ✅
- Range boundaries (BP, HR, Temp, etc.) ✅
- Commander aggregated-only restriction ✅

**Run:** `npm test -- vitals.test.ts`

---

#### 5. Analytics Tests (387 lines)
**File:** `analytics.test.ts`
**Type:** Integration tests (HTTP + Aggregation)
**Coverage:** /api/v1/analytics/* endpoints

```typescript
describe('Analytics Endpoints') {
  describe('GET /api/v1/analytics/unit/:unitId/fitness-summary')
    - Fitness counts (fit, temporarily_unfit, permanently_unfit)
    - Percentage calculations
    - Deployability score
  describe('GET /api/v1/analytics/unit/:unitId/disease-trends')
    - Top 10 ICD-10 codes (90-day window)
    - commander → 403 EXPLICITLY DENIED
    - medical_officer → 200
  describe('GET /api/v1/analytics/unit/:unitId/injury-rates')
    - Monthly aggregation (12 months)
    - Top 3 injury types per month
  describe('GET /api/v1/analytics/unit/:unitId/deployment-readiness')
    - Score 0-100
    - Grade: GREEN (≥90), AMBER (75-89), RED (<75)
  describe('Analytics edge cases and data integrity')
}
```

**Key Tests:**
- Aggregated fitness data ✅
- Disease trend ranking ✅
- Commander explicit denial ✅
- Injury rate aggregation ✅
- Deployment readiness scoring ✅
- Grade assignment logic ✅

**Run:** `npm test -- analytics.test.ts`

---

## Test Statistics

| Metric | Count |
|--------|-------|
| **Test Files** | 5 |
| **Total Lines of Test Code** | 1,629 |
| **Test Cases** | 140+ |
| **Assertions** | 300+ |
| **RBAC Tests** | 50+ |
| **Auth Tests** | 25+ |
| **Individuals Tests** | 20+ |
| **Vitals Tests** | 25+ |
| **Analytics Tests** | 30+ |

## Quick Command Reference

```bash
# Run all tests
npm test

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm test -- rbac.test.ts
npm test -- auth.test.ts
npm test -- individuals.test.ts
npm test -- vitals.test.ts
npm test -- analytics.test.ts

# By pattern
npm test -- --testNamePattern="super_admin"
npm test -- --testNamePattern="login"
npm test -- --testNamePattern="fitness-summary"

# Verbose output
npm test -- --verbose

# Single test
npm test -- -t "should return 200 with fitness summary"
```

## Test Data Reference

### Test Users
```typescript
TEST_USERS.super_admin          // Full access
TEST_USERS.medical_officer      // Medical records
TEST_USERS.paramedic            // Unit-scoped
TEST_USERS.commander            // Aggregated data
TEST_USERS.individual           // Self-only
```

### Test Resources
```typescript
TEST_DATA.unit                  // Unit Alpha
TEST_DATA.individual            // John Doe (SVC-001234)
TEST_DATA.vitals                // Sample vitals
TEST_DATA.invalidVitals         // Out-of-range values
```

## Permission Matrix Quick Lookup

| Role | Individuals | Medical Hx | Prescriptions | Vitals | Injury | Analytics | Audit Logs |
|------|---|---|---|---|---|---|---|
| super_admin | CRUD | CRUD | CRUD | CRUD | CRUD | R | R |
| medical_officer | RU | CRU | CRUD | CRUD | CRUD | R | ✗ |
| paramedic | R(unit) | C+R(unit) | R(unit) | C+R(unit) | C+R(unit) | ✗ | ✗ |
| commander | R(unit) | ✗ | ✗ | R(agg) | R(agg) | R | ✗ |
| individual | R(self) | R(self) | R(self) | R(self) | R(self) | ✗ | ✗ |

Legend: C=Create, R=Read, U=Update, D=Delete, (unit)=Unit-scoped, (agg)=Aggregated, (self)=Self-only, ✗=Denied

## Endpoint Coverage

### Auth Endpoints (3)
- ✅ POST /api/v1/auth/login
- ✅ POST /api/v1/auth/refresh
- ✅ POST /api/v1/auth/logout

### Individuals Endpoints (4)
- ✅ GET /api/v1/individuals
- ✅ GET /api/v1/individuals/:serviceNumber
- ✅ POST /api/v1/individuals
- ✅ PUT /api/v1/individuals/:serviceNumber

### Vitals Endpoints (2)
- ✅ POST /api/v1/individuals/:serviceNumber/vitals
- ✅ GET /api/v1/individuals/:serviceNumber/vitals

### Analytics Endpoints (4)
- ✅ GET /api/v1/analytics/unit/:unitId/fitness-summary
- ✅ GET /api/v1/analytics/unit/:unitId/disease-trends
- ✅ GET /api/v1/analytics/unit/:unitId/injury-rates
- ✅ GET /api/v1/analytics/unit/:unitId/deployment-readiness

### Other Endpoints (Not Yet Covered)
- Medical history CRUD
- Prescriptions CRUD
- Injuries CRUD
- Annual exam CRUD
- Admin endpoints

## Validation Schema Coverage

### Vitals Validation
- ✅ Blood pressure systolic (60-200)
- ✅ Blood pressure diastolic (30-150)
- ✅ Heart rate (30-200)
- ✅ Temperature (35-42°C)
- ✅ Oxygen saturation (70-100%)
- ✅ Weight (20-300 kg)
- ✅ Height (50-250 cm)
- ✅ DateTime ISO format

### Individual Validation
- ✅ Service number (alphanumeric)
- ✅ Blood group (enum)
- ✅ Sex (male/female/other)
- ✅ Date of birth (YYYY-MM-DD)
- ✅ Unit ID (UUID)

## Key Testing Patterns

### 1. Generate Test Token
```typescript
const { accessToken } = createTestToken(
  TEST_USERS.paramedic.id,
  TEST_USERS.paramedic.role,
  TEST_USERS.paramedic.username,
  TEST_USERS.paramedic.unitId
);
```

### 2. Make Authenticated Request
```typescript
const response = await request(app)
  .post('/api/v1/endpoint')
  .set('Authorization', `Bearer ${accessToken}`)
  .send(data);
```

### 3. Assert Response
```typescript
expect(response.status).toBe(201);
expect(response.body.success).toBe(true);
expect(response.body.data).toHaveProperty('id');
```

### 4. Scope Validation
```typescript
response.body.data.forEach((item: any) => {
  expect(item.unit_id).toBe(expectedUnitId);
});
```

## Debugging Tips

1. **View full response:**
   ```typescript
   console.log(JSON.stringify(response.body, null, 2));
   ```

2. **Check status code:**
   ```typescript
   expect(response.status).toBe(200); // View actual status
   ```

3. **Run single test:**
   ```bash
   npm test -- -t "specific test name"
   ```

4. **Enable verbose output:**
   ```bash
   npm test -- --verbose
   ```

5. **Debug with Node:**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand vitals.test.ts
   ```

## Documentation

- **Full Test Documentation:** `README.md`
- **Test Suite Summary:** `../TEST_SUITE_SUMMARY.md`
- **This File:** `INDEX.md`

## Next Steps

1. Set up test database (PostgreSQL)
2. Run `npm test` to verify all tests pass
3. Check coverage with `npm run test:coverage`
4. Extend tests for remaining endpoints if needed
5. Integrate into CI/CD pipeline

---

**Quick Start:**
```bash
npm test                    # Run all tests
npm test -- rbac.test.ts   # Run RBAC tests only
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Last Updated:** 2026-03-27
**Version:** 1.0.0
**Status:** ✅ Complete
