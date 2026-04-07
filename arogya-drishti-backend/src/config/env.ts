import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY!,
  },

  rateLimit: {
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
  },

  cors: {
    // Dev: accept any origin (LAN/mobile testing)
    // Production: accept origins listed in CORS_ORIGIN env var +
    //             any *.vercel.app deployment URL automatically
    origin: process.env.NODE_ENV === 'development'
      ? (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => cb(null, true)
      : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
          const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3000')
            .split(',')
            .map(s => s.trim());
          // Always allow Vercel preview/production deployments
          if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
            cb(null, true);
          } else {
            cb(new Error(`CORS: origin ${origin} not allowed`));
          }
        },
  },
} as const;

// Validate required env vars at startup
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (256 bits)');
  }
  if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters (256 bits)');
  }
}
