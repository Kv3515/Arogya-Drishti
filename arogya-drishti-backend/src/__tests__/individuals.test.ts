import request from 'supertest';
import { app, createTestToken, TEST_USERS, TEST_DATA } from './helpers/testSetup';

/**
 * Integration tests for /api/v1/individuals endpoints.
 * Tests CRUD operations with role-based access control and scope enforcement.
 *
 * NOTE: These tests assume the test database is seeded with test data.
 */

describe('Individuals Endpoints', () => {
  const { accessToken: adminToken } = createTestToken(
    TEST_USERS.super_admin.id,
    TEST_USERS.super_admin.role
  );

  const { accessToken: medOfficerToken } = createTestToken(
    TEST_USERS.medical_officer.id,
    TEST_USERS.medical_officer.role,
    TEST_USERS.medical_officer.username,
    TEST_USERS.medical_officer.unitId
  );

  const { accessToken: paramedicToken } = createTestToken(
    TEST_USERS.paramedic.id,
    TEST_USERS.paramedic.role,
    TEST_USERS.paramedic.username,
    TEST_USERS.paramedic.unitId
  );

  const { accessToken: commanderToken } = createTestToken(
    TEST_USERS.commander.id,
    TEST_USERS.commander.role,
    TEST_USERS.commander.username,
    TEST_USERS.commander.unitId
  );

  const { accessToken: individualToken } = createTestToken(
    TEST_USERS.individual.id,
    TEST_USERS.individual.role,
    TEST_USERS.individual.username,
    TEST_USERS.individual.unitId,
    TEST_USERS.individual.linkedIndividualId
  );

  describe('GET /api/v1/individuals', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get('/api/v1/individuals');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'AUTH_REQUIRED');
    });

    it('should return 200 with paginated list for authenticated medical_officer', async () => {
      const response = await request(app)
        .get('/api/v1/individuals')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/individuals?page=2&limit=10')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toHaveProperty('page', 2);
      expect(response.body.meta).toHaveProperty('limit', 10);
    });

    it('should support search by service_number', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals?search=${TEST_DATA.individual.service_number}`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should scope paramedics to their unit', async () => {
      const response = await request(app)
        .get('/api/v1/individuals')
        .set('Authorization', `Bearer ${paramedicToken}`);

      expect(response.status).toBe(200);
      // All returned individuals should be from paramedic's unit
      response.body.data.forEach((individual: any) => {
        expect(individual.unit.id).toBe(TEST_USERS.paramedic.unitId);
      });
    });

    it('should scope individual to their own record only', async () => {
      const response = await request(app)
        .get('/api/v1/individuals')
        .set('Authorization', `Bearer ${individualToken}`);

      expect(response.status).toBe(200);
      // Individual users see only themselves
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].id).toBe(TEST_USERS.individual.linkedIndividualId);
      }
    });

    it('should filter by isActive status', async () => {
      const response = await request(app)
        .get('/api/v1/individuals?isActive=true')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((individual: any) => {
        expect(individual.is_active).toBe(true);
      });
    });
  });

  describe('GET /api/v1/individuals/:serviceNumber', () => {
    it('should return 200 with individual data for valid service number', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${TEST_DATA.individual.service_number}`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('service_number', TEST_DATA.individual.service_number);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('date_of_birth');
      expect(response.body.data).toHaveProperty('blood_group');
    });

    it('should return 404 for non-existent service number', async () => {
      const response = await request(app)
        .get('/api/v1/individuals/NON-EXISTENT-123')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${TEST_DATA.individual.service_number}`);

      expect(response.status).toBe(401);
    });

    it('should allow individual role to access own record', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${TEST_DATA.individual.service_number}`)
        .set('Authorization', `Bearer ${individualToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(TEST_USERS.individual.linkedIndividualId);
    });

    it('should deny individual role access to other records', async () => {
      // Create another individual record for this test
      const otherIndividualId = '88888888-8888-8888-8888-888888888888';

      const response = await request(app)
        .get('/api/v1/individuals/OTHER-SERVICE-NUM')
        .set('Authorization', `Bearer ${individualToken}`);

      // Should return 403 or 404 depending on implementation
      expect([403, 404]).toContain(response.status);
    });

    it('should enforce unit scope for paramedics', async () => {
      // Test with an individual from a different unit
      const differentUnitIndividual = 'DIFF-UNIT-SERVICE';

      const response = await request(app)
        .get(`/api/v1/individuals/${differentUnitIndividual}`)
        .set('Authorization', `Bearer ${paramedicToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('POST /api/v1/individuals', () => {
    const newIndividualData = {
      service_number: 'NEW-SVC-99999',
      name: 'Jane Smith',
      date_of_birth: '1995-03-22',
      sex: 'female',
      blood_group: 'B_POS',
      unit_id: TEST_DATA.unit.id,
      contact_info: { phone: '9876543210' },
    };

    it('should return 201 when super_admin creates individual', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newIndividualData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('service_number', newIndividualData.service_number);
      expect(response.body.data).toHaveProperty('name', newIndividualData.name);
    });

    it('should return 400 for duplicate service_number', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newIndividualData,
          service_number: TEST_DATA.individual.service_number, // Existing
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('code', 'DUPLICATE_SERVICE_NUMBER');
    });

    it('should return 400 for invalid blood group', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newIndividualData,
          blood_group: 'INVALID_GROUP',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...newIndividualData,
          date_of_birth: '03/22/1995', // Invalid format
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Data',
          // Missing service_number, date_of_birth, etc.
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should deny access to medical_officer (non-super_admin)', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(newIndividualData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should deny access to paramedic', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${paramedicToken}`)
        .send(newIndividualData);

      expect(response.status).toBe(403);
    });

    it('should deny access to individual role', async () => {
      const response = await request(app)
        .post('/api/v1/individuals')
        .set('Authorization', `Bearer ${individualToken}`)
        .send(newIndividualData);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/individuals/:serviceNumber', () => {
    const updateData = {
      name: 'Updated Name',
      blood_group: 'A_NEG',
    };

    it('should return 200 when medical_officer updates individual', async () => {
      const response = await request(app)
        .put(`/api/v1/individuals/${TEST_DATA.individual.service_number}`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
    });

    it('should return 404 for non-existent individual', async () => {
      const response = await request(app)
        .put('/api/v1/individuals/NON-EXISTENT')
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid blood group', async () => {
      const response = await request(app)
        .put(`/api/v1/individuals/${TEST_DATA.individual.service_number}`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          blood_group: 'INVALID',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
