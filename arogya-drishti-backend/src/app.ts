import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { requestId, globalErrorHandler } from './utils/response';
import { authRateLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './routes/auth.routes';
import individualsRoutes from './routes/individuals.routes';
import medicalHistoryRoutes from './routes/medical-history.routes';
import vitalsRoutes from './routes/vitals.routes';
import injuriesRoutes from './routes/injuries.routes';
import prescriptionsRoutes from './routes/prescriptions.routes';
import annualExamRoutes from './routes/annual-exam.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import unitsRoutes from './routes/units.routes';
import allergiesRoutes from './routes/allergies.routes';
import notificationsRoutes from './routes/notifications.routes';

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

app.use(cors({
  origin: config.cors.origin as string[],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Global rate limiter: 100 req/min per IP (auth has its own stricter limiter)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Parsing Middleware ─────────────────────────────────────────────────────────

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestId);

// ─── Health Check ───────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────────

// Apply stricter rate limiter to auth routes (login lockout: 5 attempts / 15 min)
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/individuals', individualsRoutes);
app.use('/api/v1/individuals', medicalHistoryRoutes);
app.use('/api/v1/individuals', vitalsRoutes);
app.use('/api/v1/individuals', injuriesRoutes);
app.use('/api/v1/individuals', prescriptionsRoutes);
app.use('/api/v1/individuals', annualExamRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/units', unitsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/individuals', allergiesRoutes);
app.use('/api/v1/notifications', notificationsRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    meta: { timestamp: new Date().toISOString() },
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────

app.use(globalErrorHandler);

export default app;
