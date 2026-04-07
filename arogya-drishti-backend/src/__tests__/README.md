# Arogya Drishti Backend Test Suite

Complete test suite for the Arogya Drishti medical intelligence platform backend using Jest and Supertest.

## Overview

This test suite provides comprehensive coverage of the backend API with 100+ test cases across authentication, RBAC, and all major endpoints.

### Test Files

- **`helpers/testSetup.ts`** — Shared test utilities and test data
- **`rbac.test.ts`** — Unit tests for RBAC permission matrix (50+ tests)
- **`auth.test.ts`** — Integration tests for authentication endpoints (25+ tests)
- **`individuals.test.ts`** — Integration tests for individuals endpoints (20+ tests)
- **`vitals.test.ts`** — Integration tests for vitals logging (25+ tests)
- **`analytics.test.ts`** — Integration tests for analytics endpoints (30+ tests)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="RBAC"
```

## Test Database Setup

**Important:** These tests require a test database. Set up as follows:

### Option 1: Use Test Database URL (Recommended)
```bash
# Create a .env.test file
cp .env .env.test

# Update DATABASE_URL to point to test database
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/arogya_drishti_test" >> .env.test

# Load before tests
export NODE_ENV=test
npm test
```

### Option 2: Docker Compose (Full Setup)
```bash
# Start test database container
docker compose up -d postgres-test

# Run migrations
npm run db:migrate -- --skip-generate

# Seed test data
npm run db:seed

# Run tests
npm test
```

### Option 3: Mock Database (for CI/CD)
For GitHub Actions or other CI/CD, mock Prisma at the test level:
```typescript
jest.mock('../../config/database', () => ({
  default: {
    user: { findUnique: jest.fn(), create: jest.fn(), ... },
    individual: { findUnique: jest.fn(), ... },
    // ... other models
  }
}));
```

## Test Data

Test data is defined in `helpers/testSetup.ts`:

### Test Users
- `super_admin` — Full system access
- `medical_officer` — Can manage medical records
- `paramedic` — Unit-scoped access
- `commander` — Aggregated data only
- `individual` — Self-only access

### Test Unit & Individual
```typescript
TEST_USERS.medical_officer.unitId  // "33333333-3333-3333-3333-333333333333"
TEST_DATA.individual.service_number // "SVC-001234"
```

## Key Test Scenarios

### RBAC Tests (`rbac.test.ts`)
- ✅ super_admin has full CRUD on all resources
- ✅ medical_officer can CRU individuals, CRUD prescriptions, NO audit_logs
- ✅ paramedic has unit-scoped read on individuals, can create vitals, NO analytics
- ✅ commander has aggregated read on vitals/injuries, DENIED on medical_history
- ✅ individual has self-only read on all medical resources
- ✅ Permission boundary tests (negative cases)

### Auth Tests (`auth.test.ts`)
- ✅ Login with valid/invalid credentials
- ✅ Refresh token rotation (old token revoked)
- ✅ Logout clears cookies and revokes tokens
- ✅ Token expiration validation
- ✅ Bearer token format enforcement

### Individuals Tests (`individuals.test.ts`)
- ✅ GET /individuals with pagination and filtering
- ✅ GET /individuals/:serviceNumber with scope enforcement
- ✅ POST /individuals (super_admin only, duplicate check)
- ✅ PUT /individuals/:serviceNumber (medical_officer can update)
- ✅ Individual role accessing own record (allowed)
- ✅ Individual role accessing other's record (denied 403)

### Vitals Tests (`vitals.test.ts`)
- ✅ POST /individuals/:svcNo/vitals (medical_officer, paramedic allowed)
- ✅ POST denied for commander
- ✅ Zod validation: BP, heart rate, temperature, O2 sat ranges
- ✅ GET /individuals/:svcNo/vitals with date range filtering
- ✅ Commander denied individual-level vitals (aggregated only)

### Analytics Tests (`analytics.test.ts`)
- ✅ GET /analytics/unit/:unitId/fitness-summary (all roles)
- ✅ GET /analytics/unit/:unitId/disease-trends (medical_officer only, commander DENIED)
- ✅ GET /analytics/unit/:unitId/injury-rates (commander allowed)
- ✅ GET /analytics/unit/:unitId/deployment-readiness with grade scoring
- ✅ Unit scope enforcement for commanders
- ✅ Percentage calculations accuracy

## Test Organization

Each test file follows this structure:

```typescript
describe('Feature/Endpoint', () => {
  describe('Specific endpoint or scenario', () => {
    it('should test specific behavior', async () => {
      const response = await request(app)
        .get('/api/v1/endpoint')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // ... assertions
    });
  });
});
```

## Best Practices Used

1. **Supertest for HTTP testing** — Real request/response testing
2. **Token generation helpers** — Consistent JWT creation across tests
3. **Arrange-Act-Assert pattern** — Clear test structure
4. **Negative test cases** — Testing what should fail
5. **Scope enforcement validation** — RBAC and unit boundaries
6. **Edge case testing** — Boundary values for vitals ranges
7. **Stateful testing** — Login → Refresh → Logout flow
8. **Mock-friendly helpers** — Easy to extend with database mocks

## Coverage Goals

- **RBAC Middleware**: 100% (all role/resource/action combinations)
- **Auth Endpoints**: 95% (login, refresh, logout flows + edge cases)
- **Individuals Endpoints**: 90% (CRUD + permissions + scope)
- **Vitals Endpoints**: 90% (creation, filtering, validation)
- **Analytics Endpoints**: 85% (all 4 endpoints, aggregation logic)

Current test count: **140+ assertions across 80+ test cases**

## Common Issues & Troubleshooting

### Database Connection Errors
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running and DATABASE_URL is correct
```bash
psql -c "CREATE DATABASE arogya_drishti_test;"
npm run db:migrate
```

### JWT Secret Not Found
```
Error: JWT_SECRET not set
```
**Solution:** Ensure `.env` or `.env.test` has JWT secrets
```bash
JWT_SECRET="your-256-bit-hex-secret-here"
JWT_REFRESH_SECRET="your-256-bit-hex-secret-here"
```

### Prisma Not Synchronized
```
Error: Schema not up to date
```
**Solution:** Generate Prisma client
```bash
npm run db:generate
npm run db:migrate
```

### Tests Hanging
```
Jest has not exited
```
**Solution:** Tests are using `--forceExit` flag. If test is actually hanging:
```bash
# Check for open database connections
npm test -- --detectOpenHandles
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/arogya_test
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
  run: npm test -- --coverage
```

## Extending Tests

### Adding a New Test
1. Create test file: `src/__tests__/feature.test.ts`
2. Import test helpers:
   ```typescript
   import { app, createTestToken, TEST_USERS } from './helpers/testSetup';
   ```
3. Write test following the pattern:
   ```typescript
   describe('Feature', () => {
     it('should do something', async () => {
       const { accessToken } = createTestToken(
         TEST_USERS.role.id,
         TEST_USERS.role.role
       );
       const response = await request(app)
         .get('/api/v1/endpoint')
         .set('Authorization', `Bearer ${accessToken}`);
       expect(response.status).toBe(200);
     });
   });
   ```

### Mocking Prisma (Unit Tests)
```typescript
jest.mock('../../config/database', () => ({
  default: {
    individual: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-id',
        service_number: 'TEST-123',
      }),
    },
  },
}));
```

## Performance

- **Total test suite runtime**: ~30-60 seconds (depends on database)
- **Average test runtime**: 200-500ms per test
- **Coverage mode**: ~90-120 seconds with coverage reports

Optimize with:
```bash
npm test -- --maxWorkers=4  # Parallel execution
npm test -- rbac.test.ts     # Run single file
```

## Support & Debugging

### Enable verbose logging
```bash
npm test -- --verbose
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand vitals.test.ts
```

### Check test coverage gaps
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html
```

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Zod Validation](https://zod.dev/)
- [JWT Security](https://tools.ietf.org/html/rfc7519)

---

**Last Updated:** 2026-03-27
**Test Suite Version:** 1.0.0
**Coverage Target:** 85%+
