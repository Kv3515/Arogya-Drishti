import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import app from '../../app';

/**
 * Test helper utilities for Arogya Drishti backend tests.
 * Provides utilities for generating tokens, seeding test data, and setup/teardown.
 */

export interface TestToken {
  accessToken: string;
  refreshToken: string;
}

export interface TestUser {
  id: string;
  username: string;
  role: 'super_admin' | 'medical_officer' | 'paramedic' | 'commander' | 'individual';
  unitId: string | null;
  linkedIndividualId: string | null;
}

/**
 * Creates a signed JWT access token for testing.
 * Mimics the actual generateTokens function signature.
 */
export function createTestToken(
  userId: string,
  role: 'super_admin' | 'medical_officer' | 'paramedic' | 'commander' | 'individual',
  username: string = 'testuser',
  unitId: string | null = null,
  linkedIndividualId: string | null = null
): TestToken {
  const accessToken = jwt.sign(
    {
      sub: userId,
      username,
      role,
      unitId,
      linkedIndividualId,
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: 900, // 15 minutes
    }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwt.refreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: 604800, // 7 days
    }
  );

  return { accessToken, refreshToken };
}

/**
 * Creates an expired access token (for testing token expiration scenarios).
 */
export function createExpiredToken(
  userId: string,
  role: 'super_admin' | 'medical_officer' | 'paramedic' | 'commander' | 'individual'
): string {
  return jwt.sign(
    {
      sub: userId,
      username: 'testuser',
      role,
      unitId: null,
      linkedIndividualId: null,
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: '-1s', // Already expired
    }
  );
}

/**
 * Creates an invalid token (signed with wrong secret).
 */
export function createInvalidToken(): string {
  return jwt.sign(
    {
      sub: 'test-user-id',
      username: 'testuser',
      role: 'super_admin',
      unitId: null,
      linkedIndividualId: null,
    },
    'wrong-secret-key',
    { algorithm: 'HS256' }
  );
}

/**
 * Provides the Express app instance for testing with Supertest.
 */
export { app };

/**
 * Test database setup helper.
 * In a real scenario, this would:
 * - Reset the database before each test suite
 * - Seed minimal test data
 * - Clean up after tests
 *
 * For now, it's a placeholder that assumes DATABASE_URL points to a test DB.
 */
export async function setupTestDatabase(): Promise<void> {
  // In production, you'd run:
  // await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  // Or use a test database container (Docker/Testcontainers)
  // For this implementation, assumes separate TEST_DATABASE_URL
  console.log('Test database setup would run here');
}

export async function teardownTestDatabase(): Promise<void> {
  console.log('Test database teardown would run here');
}

/**
 * Mock user credentials for login tests.
 */
export const TEST_USERS = {
  super_admin: {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'admin',
    password: 'AdminPass123!', // Must match password hash in test DB
    role: 'super_admin' as const,
    unitId: null,
  },
  medical_officer: {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'med_officer',
    password: 'MedOff123!@#',
    role: 'medical_officer' as const,
    unitId: '33333333-3333-3333-3333-333333333333',
  },
  paramedic: {
    id: '44444444-4444-4444-4444-444444444444',
    username: 'paramedic_user',
    password: 'Para123!@#Med',
    role: 'paramedic' as const,
    unitId: '33333333-3333-3333-3333-333333333333',
  },
  commander: {
    id: '55555555-5555-5555-5555-555555555555',
    username: 'commander_user',
    password: 'Cmd123!@#Lead',
    role: 'commander' as const,
    unitId: '33333333-3333-3333-3333-333333333333',
  },
  individual: {
    id: '66666666-6666-6666-6666-666666666666',
    username: 'individual_user',
    password: 'Ind123!@#User',
    role: 'individual' as const,
    unitId: '33333333-3333-3333-3333-333333333333',
    linkedIndividualId: '77777777-7777-7777-7777-777777777777',
  },
};

/**
 * Mock test data for endpoints.
 */
export const TEST_DATA = {
  unit: {
    id: '33333333-3333-3333-3333-333333333333',
    unit_name: 'Test Unit Alpha',
  },
  individual: {
    id: '77777777-7777-7777-7777-777777777777',
    service_number: 'SVC-001234',
    name: 'John Doe',
    date_of_birth: '1990-05-15',
    sex: 'male',
    blood_group: 'O_POS',
    unit_id: '33333333-3333-3333-3333-333333333333',
    contact_info: { phone: '1234567890', email: 'john@example.com' },
  },
  vitals: {
    recorded_at: new Date().toISOString(),
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    heart_rate: 72,
    temperature_celsius: 37.0,
    oxygen_saturation: 98,
    weight_kg: 75,
    height_cm: 180,
  },
  invalidVitals: {
    blood_pressure_systolic: 250, // Out of range
    blood_pressure_diastolic: 80,
    heart_rate: 72,
  },
};
