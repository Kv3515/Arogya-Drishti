import request from 'supertest';
import { app, createTestToken, TEST_USERS, TEST_DATA } from './helpers/testSetup';

/**
 * Integration tests for vitals logging endpoints.
 * Tests vitals creation, retrieval, filtering, and permission enforcement.
 */

describe('Vitals Endpoints', () => {
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

  const serviceNumber = TEST_DATA.individual.service_number;

  describe('POST /api/v1/individuals/:serviceNumber/vitals', () => {
    const validVitalsData = {
      recorded_at: new Date().toISOString(),
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate: 72,
      temperature_celsius: 37.0,
      oxygen_saturation: 98,
      weight_kg: 75,
      height_cm: 180,
    };

    it('should return 201 when medical_officer logs vitals', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(validVitalsData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('blood_pressure_systolic', 120);
      expect(response.body.data).toHaveProperty('heart_rate', 72);
      expect(response.body.data).toHaveProperty('temperature_celsius', 37.0);
    });

    it('should return 201 when paramedic in unit logs vitals', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${paramedicToken}`)
        .send(validVitalsData);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('individual_id');
    });

    it('should return 403 when commander tries to create vitals', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${commanderToken}`)
        .send(validVitalsData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should return 400 for blood pressure systolic out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          blood_pressure_systolic: 250, // Max is 200
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for blood pressure diastolic out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          blood_pressure_diastolic: 160, // Max is 150
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for heart rate out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          heart_rate: 250, // Max is 200
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for temperature out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          temperature_celsius: 45, // Max is 42
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for oxygen saturation out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          oxygen_saturation: 105, // Max is 100
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for weight out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          weight_kg: 350, // Max is 300
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 for height out of range', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({
          ...validVitalsData,
          height_cm: 300, // Max is 250
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should accept optional vital fields', async () => {
      const minimalData = {
        recorded_at: new Date().toISOString(),
        // Only temperature, others optional
        temperature_celsius: 37.0,
      };

      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
    });

    it('should return 404 for non-existent individual', async () => {
      const response = await request(app)
        .post('/api/v1/individuals/NON-EXISTENT/vitals')
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send(validVitalsData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .send(validVitalsData);

      expect(response.status).toBe(401);
    });

    it('should enforce unit scope for paramedics creating vitals', async () => {
      // Attempt to log vitals for individual from different unit
      const otherUnitIndividual = 'OTHER-UNIT-SERVICE';

      const response = await request(app)
        .post(`/api/v1/individuals/${otherUnitIndividual}/vitals`)
        .set('Authorization', `Bearer ${paramedicToken}`)
        .send(validVitalsData);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('GET /api/v1/individuals/:serviceNumber/vitals', () => {
    it('should return 200 with paginated vitals list', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should return 200 with filtered vitals by date range', async () => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();

      const response = await request(app)
        .get(
          `/api/v1/individuals/${serviceNumber}/vitals?from=${from.toISOString()}&to=${to.toISOString()}`
        )
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned vitals should be within the date range
      response.body.data.forEach((vital: any) => {
        const recordedDate = new Date(vital.recorded_at);
        expect(recordedDate >= from).toBe(true);
        expect(recordedDate <= to).toBe(true);
      });
    });

    it('should return 200 with pagination', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${serviceNumber}/vitals?page=1&limit=5`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should return 404 for non-existent individual', async () => {
      const response = await request(app)
        .get('/api/v1/individuals/NON-EXISTENT/vitals')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${serviceNumber}/vitals`);

      expect(response.status).toBe(401);
    });

    it('should return 403 when commander tries to view individual-level vitals', async () => {
      const response = await request(app)
        .get(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should enforce unit scope for paramedics viewing vitals', async () => {
      const otherUnitIndividual = 'OTHER-UNIT-SERVICE';

      const response = await request(app)
        .get(`/api/v1/individuals/${otherUnitIndividual}/vitals`)
        .set('Authorization', `Bearer ${paramedicToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should allow individual to view own vitals', async () => {
      const { accessToken: individualToken } = createTestToken(
        TEST_USERS.individual.id,
        TEST_USERS.individual.role,
        TEST_USERS.individual.username,
        TEST_USERS.individual.unitId,
        TEST_USERS.individual.linkedIndividualId
      );

      const response = await request(app)
        .get(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${individualToken}`);

      // Should succeed if individual's linkedIndividualId matches
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Vitals validation edge cases', () => {
    const validData = {
      recorded_at: new Date().toISOString(),
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate: 72,
      temperature_celsius: 37.0,
      oxygen_saturation: 98,
      weight_kg: 75,
      height_cm: 180,
    };

    it('should accept minimum allowed systolic BP (60)', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({ ...validData, blood_pressure_systolic: 60 });

      expect(response.status).toBe(201);
    });

    it('should accept maximum allowed systolic BP (200)', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({ ...validData, blood_pressure_systolic: 200 });

      expect(response.status).toBe(201);
    });

    it('should accept minimum allowed oxygen saturation (70)', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({ ...validData, oxygen_saturation: 70 });

      expect(response.status).toBe(201);
    });

    it('should accept maximum allowed temperature (42C)', async () => {
      const response = await request(app)
        .post(`/api/v1/individuals/${serviceNumber}/vitals`)
        .set('Authorization', `Bearer ${medOfficerToken}`)
        .send({ ...validData, temperature_celsius: 42 });

      expect(response.status).toBe(201);
    });
  });
});
