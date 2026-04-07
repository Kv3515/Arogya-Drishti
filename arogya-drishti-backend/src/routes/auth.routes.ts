import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { authenticate } from '../middleware/auth';
import { validate, loginSchema } from '../validators';
import { login, refresh, logout, getMe, updateMyCredentials } from '../controllers/auth.controller';

const router = Router();

// Strict rate limiter for login — 5 attempts per 15 minutes per IP+username
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  keyGenerator: (req) => `${req.ip ?? req.socket.remoteAddress ?? 'unknown'}:${req.body?.username || 'unknown'}`,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'LOGIN_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/me/credentials', authenticate, updateMyCredentials);

export default router;
