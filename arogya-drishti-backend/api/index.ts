/**
 * Vercel Serverless Entry Point
 * Wraps the Express app for Vercel's @vercel/node runtime.
 */
import { validateEnv } from '../src/config/env';
import app from '../src/app';

// Validate required env vars on cold start
validateEnv();

export default app;
