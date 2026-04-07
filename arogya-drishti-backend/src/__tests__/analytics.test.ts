import request from 'supertest';
import { app, createTestToken, TEST_USERS, TEST_DATA } from './helpers/testSetup';

/**
 * Integration tests for analytics endpoints.
 * Tests aggregated health metrics with role-based access control.
 */

describe('Analytics Endpoints', () => {
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

  const { accessToken: commanderToken } = createTestToken(
    TEST_USERS.commander.id,
    TEST_USERS.commander.role,
    TEST_USERS.commander.username,
    TEST_USERS.commander.unitId
  );

  const { accessToken: paramedicToken } = createTestToken(
    TEST_USERS.paramedic.id,
    TEST_USERS.paramedic.role,
    TEST_USERS.paramedic.username,
    TEST_USERS.paramedic.unitId
  );

  const { accessToken: individualToken } = createTestToken(
    TEST_USERS.individual.id,
    TEST_USERS.individual.role,
    TEST_USERS.individual.username,
    TEST_USERS.individual.unitId,
    TEST_USERS.individual.linkedIndividualId
  );

  const unitId = TEST_DATA.unit.id;

  describe('GET /api/v1/analytics/unit/:unitId/fitness-summary', () => {
    it('should return 200 with fitness summary for commander', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/fitness-summary`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('unit_name');
      expect(response.body.data).toHaveProperty('unit_id', unitId);
      expect(response.body.data).toHaveProperty('fitness_summary');
      expect(response.body.data.fitness_summary).toHaveProperty('fit');
      expect(response.body.data.fitness_summary).toHaveProperty('temporarily_unfit');
      expect(response.body.data.fitness_summary).toHaveProperty('permanently_unfit');
      expect(response.body.data.fitness_summary).toHaveProperty('total');
      expect(response.body.data.fitness_summary).toHaveProperty('pct_fit');
      expect(response.body.data.fitness_summary).toHaveProperty('pct_deployable');
    });

    it('should return 200 with fitness summary for medical_officer', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/fitness-summary`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('fitness_summary');
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/unit/00000000-0000-0000-0000-000000000000/fitness-summary')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should enforce unit scope for commanders', async () => {
      // Commander accessing different unit
      const differentUnitId = '99999999-9999-9999-9999-999999999999';

      const response = await request(app)
        .get(`/api/v1/analytics/unit/${differentUnitId}/fitness-summary`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'UNIT_SCOPE_VIOLATION');
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/fitness-summary`);

      expect(response.status).toBe(401);
    });

    it('should deny access to individual role', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/fitness-summary`)
        .set('Authorization', `Bearer ${individualToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/analytics/unit/:unitId/disease-trends', () => {
    it('should return 200 with disease trends for medical_officer', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('unit_name');
      expect(response.body.data).toHaveProperty('period_days', 90);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should return trends with diagnosis_code and count', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      response.body.data.trends.forEach((trend: any) => {
        expect(trend).toHaveProperty('diagnosis_code');
        expect(trend).toHaveProperty('count');
        expect(typeof trend.count).toBe('number');
      });
    });

    it('should return at most 10 trends', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.trends.length).toBeLessThanOrEqual(10);
    });

    it('should return 403 EXPLICITLY DENIED for commander', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/unit/00000000-0000-0000-0000-000000000000/disease-trends')
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`);

      expect(response.status).toBe(401);
    });

    it('should deny access to paramedic', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/disease-trends`)
        .set('Authorization', `Bearer ${paramedicToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/analytics/unit/:unitId/injury-rates', () => {
    it('should return 200 with injury rates for commander in own unit', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/injury-rates`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('unit_name');
      expect(response.body.data).toHaveProperty('period_months', 12);
      expect(response.body.data).toHaveProperty('monthly');
      expect(Array.isArray(response.body.data.monthly)).toBe(true);
    });

    it('should return monthly injury data with counts', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/injury-rates`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
      response.body.data.monthly.forEach((month: any) => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('count');
        expect(month).toHaveProperty('top_types');
        expect(typeof month.count).toBe('number');
        expect(Array.isArray(month.top_types)).toBe(true);
      });
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/unit/00000000-0000-0000-0000-000000000000/injury-rates')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(404);
    });

    it('should enforce unit scope for commanders', async () => {
      const differentUnitId = '99999999-9999-9999-9999-999999999999';

      const response = await request(app)
        .get(`/api/v1/analytics/unit/${differentUnitId}/injury-rates`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/injury-rates`);

      expect(response.status).toBe(401);
    });

    it('should allow medical_officer to view injury rates', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/injury-rates`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/analytics/unit/:unitId/deployment-readiness', () => {
    it('should return 200 with deployment readiness score', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('unit_name');
      expect(response.body.data).toHaveProperty('total_personnel');
      expect(response.body.data).toHaveProperty('deployable');
      expect(response.body.data).toHaveProperty('non_duty');
      expect(response.body.data).toHaveProperty('permanently_unfit');
      expect(response.body.data).toHaveProperty('readiness_score');
      expect(response.body.data).toHaveProperty('readiness_grade');
    });

    it('should return readiness grade GREEN for score >= 90', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      const grade = response.body.data.readiness_grade;
      const score = response.body.data.readiness_score;

      if (score >= 90) {
        expect(grade).toBe('GREEN');
      }
    });

    it('should return readiness grade AMBER for score 75-89', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      const grade = response.body.data.readiness_grade;
      const score = response.body.data.readiness_score;

      if (score >= 75 && score < 90) {
        expect(grade).toBe('AMBER');
      }
    });

    it('should return readiness grade RED for score < 75', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      const grade = response.body.data.readiness_grade;
      const score = response.body.data.readiness_score;

      if (score < 75) {
        expect(grade).toBe('RED');
      }
    });

    it('should have valid percentage values for deployable and non_duty', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      const { deployable, non_duty, permanently_unfit, total_personnel } = response.body.data;

      expect(deployable + non_duty + permanently_unfit).toBeLessThanOrEqual(total_personnel);
      expect(deployable).toBeGreaterThanOrEqual(0);
      expect(non_duty).toBeGreaterThanOrEqual(0);
      expect(permanently_unfit).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/unit/00000000-0000-0000-0000-000000000000/deployment-readiness')
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(404);
    });

    it('should enforce unit scope for commanders', async () => {
      const differentUnitId = '99999999-9999-9999-9999-999999999999';

      const response = await request(app)
        .get(`/api/v1/analytics/unit/${differentUnitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`);

      expect(response.status).toBe(401);
    });

    it('should allow medical_officer to view deployment readiness', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${medOfficerToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow super_admin to view deployment readiness', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Analytics edge cases and data integrity', () => {
    it('should return readiness_score between 0 and 100', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/deployment-readiness`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.readiness_score).toBeGreaterThanOrEqual(0);
      expect(response.body.data.readiness_score).toBeLessThanOrEqual(100);
    });

    it('should return correct fitness_summary percentages', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/unit/${unitId}/fitness-summary`)
        .set('Authorization', `Bearer ${commanderToken}`);

      expect(response.status).toBe(200);
      const { fit, temporarily_unfit, permanently_unfit, total, pct_fit, pct_deployable } =
        response.body.data.fitness_summary;

      // pct_fit should match fit/total
      if (total > 0) {
        const expectedPct = Math.round((fit / total) * 10000) / 100;
        expect(pct_fit).toBe(expectedPct);
      } else {
        expect(pct_fit).toBe(0);
      }
    });
  });
});
