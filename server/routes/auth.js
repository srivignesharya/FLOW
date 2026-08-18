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

    const fullName =
      user_metadata?.full_name ||
      user_metadata?.name ||
      'Student';

    const avatarUrl =
      user_metadata?.avatar_url ||
      user_metadata?.picture ||
      '';

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id,
          email,
          full_name: fullName,
          avatar_url: avatarUrl
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

/**
 * DELETE /api/v1/auth/account
 * Permanently deletes the authenticated user's account and all associated application data.
 * Respects database relationships and uses Supabase Admin API for Auth removal.
 */
router.delete('/account', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`\n⚠️ [ACCOUNT DELETION INITIATED]: Deleting all data for User ID "${userId}"`);

    // 1. Delete user-owned child records across all tables
    const { error: msgErr } = await supabaseAdmin.from('copilot_messages').delete().eq('user_id', userId);
    if (msgErr) console.warn('[DELETE ACCOUNT] copilot_messages warning:', msgErr.message);

    const { error: schedErr } = await supabaseAdmin.from('study_schedules').delete().eq('user_id', userId);
    if (schedErr) console.warn('[DELETE ACCOUNT] study_schedules warning:', schedErr.message);

    const { error: taskErr } = await supabaseAdmin.from('tasks').delete().eq('user_id', userId);
    if (taskErr) console.warn('[DELETE ACCOUNT] tasks warning:', taskErr.message);

    const { error: docErr } = await supabaseAdmin.from('documents').delete().eq('user_id', userId);
    if (docErr) console.warn('[DELETE ACCOUNT] documents warning:', docErr.message);

    // 2. Delete user profile record
    const { error: profErr } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
    if (profErr) console.warn('[DELETE ACCOUNT] profiles warning:', profErr.message);

    // 3. Permanently delete from Supabase Auth via Admin Service Role
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error('❌ [DELETE ACCOUNT AUTH FAILED]:', authErr.message);
      throw new Error(`Failed to remove auth user record: ${authErr.message}`);
    }

    console.log(`✅ [ACCOUNT DELETION SUCCESS]: User ID "${userId}" and all associated data permanently deleted.\n`);
    res.json({
      status: 'success',
      message: 'Your account and all associated data have been permanently deleted.'
    });
  } catch (err) {
    console.error('❌ [DELETE ACCOUNT ERROR]:', err);
    next(err);
  }
});

export default router;
