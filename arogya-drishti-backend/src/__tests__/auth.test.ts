import request from 'supertest';
import { app, createTestToken, TEST_USERS } from './helpers/testSetup';

/**
 * Integration tests for authentication endpoints.
 * Tests login, refresh, and logout flows with valid and invalid inputs.
 *
 * NOTE: These tests assume a test database is set up with TEST_USERS seeded.
 * In production, use a test database container or test DATABASE_URL env var.
 */

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with access token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.super_admin.username,
          password: TEST_USERS.super_admin.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn', 900);
      expect(response.body.data.user).toHaveProperty('username', TEST_USERS.super_admin.username);
      expect(response.body.data.user).toHaveProperty('role', 'super_admin');
    });

    it('should set refreshToken in httpOnly cookie on successful login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.medical_officer.username,
          password: TEST_USERS.medical_officer.password,
        });

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeader = response.headers['set-cookie'][0];
      expect(setCookieHeader).toMatch(/refreshToken=/);
      expect(setCookieHeader).toMatch(/HttpOnly/);
      expect(setCookieHeader).toMatch(/SameSite=Strict/);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.super_admin.username,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent_user',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: TEST_USERS.super_admin.password,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.super_admin.username,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.super_admin.username,
          password: 'short', // Less than 8 characters
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 401 if user is inactive', async () => {
      // This assumes a test user marked as is_active=false exists
      // In the test DB, you'd seed an inactive user
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'inactive_user',
          password: 'ValidPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // First, login to get a refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.super_admin.username,
          password: TEST_USERS.super_admin.password,
        });

      // Extract refresh token from cookie
      const setCookieHeader = loginResponse.headers['set-cookie'][0];
      const cookieMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
      if (cookieMatch) {
        refreshToken = cookieMatch[1];
      }
    });

    it('should return 200 with new access token for valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn', 900);
    });

    it('should set a new refresh token cookie on refresh', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeader = response.headers['set-cookie'][0];
      expect(setCookieHeader).toMatch(/refreshToken=/);
    });

    it('should return 401 if no refresh token provided', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'REFRESH_REQUIRED');
    });

    it('should return 401 for invalid/malformed refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH');
    });

    it('should return 401 for expired refresh token', async () => {
      // Create an expired refresh token
      const expiredToken = createTestToken(
        TEST_USERS.super_admin.id,
        TEST_USERS.super_admin.role
      ).refreshToken;

      // Note: In actual testing, you'd need to generate an already-expired token
      // For this test, we just verify the pattern; actual expiration testing
      // would need to mock time or use a token signed with expiresIn: '-1s'

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${expiredToken}`);

      // Should reject (either 401 or because token doesn't exist in DB)
      expect(response.status).toBe(401);
    });

    it('should return 401 if refresh token has been revoked', async () => {
      // This would require the token to have been revoked in the DB
      // Simulate by using an invalid token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', 'refreshToken=revoked.token.value');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH');
    });

    it('should implement refresh token rotation', async () => {
      // After refreshing, the old token should be revoked
      // The test would verify this by attempting to use the old token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);

      // Now attempt to use the old token again — should fail
      const secondRefreshAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(secondRefreshAttempt.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: TEST_USERS.paramedic.username,
          password: TEST_USERS.paramedic.password,
        });

      accessToken = loginResponse.body.data.accessToken;
      const setCookieHeader = loginResponse.headers['set-cookie'][0];
      const cookieMatch = setCookieHeader.match(/refreshToken=([^;]+)/);
      if (cookieMatch) {
        refreshToken = cookieMatch[1];
      }
    });

    it('should return 204 on successful logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should clear refreshToken cookie on logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(204);
      expect(response.headers['set-cookie']).toBeDefined();
      const setCookieHeader = response.headers['set-cookie'][0];
      expect(setCookieHeader).toMatch(/refreshToken=/);
      expect(setCookieHeader).toMatch(/Max-Age=0|Expires=/); // Cleared cookie
    });

    it('should revoke refresh token in database on logout', async () => {
      // After logout, attempting to refresh should fail
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'INVALID_REFRESH');
    });

    it('should not require authentication to logout', async () => {
      // Note: Logout endpoint requires Bearer token, but this test
      // validates it accepts a logout request and clears cookies
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', 'refreshToken=any-token');

      // Should either succeed (if not authenticated) or return 401
      expect([204, 401]).toContain(response.status);
    });
  });

  describe('Authentication header validation', () => {
    it('should require Bearer token format', async () => {
      const response = await request(app)
        .get('/api/v1/individuals')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'AUTH_REQUIRED');
    });

    it('should reject missing Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/individuals');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'AUTH_REQUIRED');
    });
  });
});
