import { z } from 'zod';

// ============================================================
// REQUEST BODY SCHEMAS (Zod)
// ============================================================

export const manualTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  subject: z.string().min(1, 'Subject is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  weightage: z.number().min(0).max(100).optional().default(0),
  priority: z.enum(['high', 'medium', 'low']),
  estimatedMinutes: z.number().positive().default(60),
  description: z.string().optional().default(''),
  taskType: z.enum(['assignment', 'exam', 'announcement', 'reading']).default('assignment')
});

export const textIngestSchema = z.object({
  textContent: z.string().min(5, 'Text content must be at least 5 characters')
});

export const copilotQuerySchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  documentId: z.string().uuid().optional()
});

export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[^\s]{8,64}$/;

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must not exceed 64 characters')
  .regex(strongPasswordRegex, 'Password must contain uppercase, lowercase, number, special character, and no spaces');

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  academic_institution: z.string().optional(),
  preferred_study_hours_per_day: z.number().int().min(1).max(16).optional()
});

// ============================================================
// VALIDATION MIDDLEWARE FACTORY
// ============================================================

/**
 * Returns Express middleware that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and defaulted) values.
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      error: 'Request validation failed',
      details: err.errors?.map(e => ({ field: e.path.join('.'), message: e.message })) || []
    });
  }
};
