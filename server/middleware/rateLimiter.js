import rateLimit from 'express-rate-limit';

/**
 * Standard limiter: 200 requests per 15 minutes per IP.
 * Applied globally to all routes.
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again in 15 minutes.'
  }
});

/**
 * AI service limiter: 30 requests per 15 minutes per IP.
 * Applied to AI-powered endpoints (ingest, planner).
 */
export const aiServiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI processing limit reached. Please wait before running more extractions.'
  }
});
