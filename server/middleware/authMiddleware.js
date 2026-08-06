import { supabaseAdmin } from '../services/supabase.js';

/**
 * Middleware: Validates Supabase JWT from Authorization header.
 * Attaches the verified user to req.user on success.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication session' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE ERROR]:', err);
    return res.status(500).json({ error: 'Auth middleware verification failure' });
  }
};
