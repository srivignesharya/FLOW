import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody, profileUpdateSchema } from '../middleware/validation.js';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

/**
 * POST /api/v1/auth/sync
 * Upserts a user profile row after Supabase auth sign-in.
 * Called automatically by the frontend on each auth state change.
 */
router.post('/sync', requireAuth, async (req, res, next) => {
  try {
    const { id, email, user_metadata } = req.user;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          email,
          full_name: user_metadata?.full_name || 'Student',
          avatar_url: user_metadata?.avatar_url || ''
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ status: 'success', profile: data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/profile
 * Returns the authenticated user's full profile.
 */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/auth/profile
 * Updates the authenticated user's profile fields.
 */
router.patch('/profile', requireAuth, validateBody(profileUpdateSchema), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
