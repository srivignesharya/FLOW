/**
 * Single exclusively authorized admin email for FLOW platform.
 */
export const EXCLUSIVE_ADMIN_EMAIL = 'flowbyimv@gmail.com';

/**
 * Checks whether a given user object has admin privileges.
 * Strict Security: ONLY flowbyimv@gmail.com is granted access.
 */
export const isUserAdmin = (user) => {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === EXCLUSIVE_ADMIN_EMAIL.toLowerCase();
};

/**
 * Middleware: Enforces that the authenticated user is strictly flowbyimv@gmail.com.
 * Must be preceded by requireAuth in the route pipeline.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const email = req.user.email.trim().toLowerCase();

    if (email !== EXCLUSIVE_ADMIN_EMAIL.toLowerCase()) {
      console.warn(`⛔ [ADMIN SECURITY ENFORCEMENT]: Unauthorized access attempt by "${req.user.email}" (${req.user.id}).`);
      return res.status(403).json({
        error: `Access Denied: Only ${EXCLUSIVE_ADMIN_EMAIL} is authorized to access the FLOW Admin Panel.`,
        code: 'EXCLUSIVE_ADMIN_REQUIRED'
      });
    }

    req.isAdmin = true;
    next();
  } catch (err) {
    console.error('[ADMIN MIDDLEWARE ERROR]:', err);
    return res.status(500).json({ error: 'Internal admin authorization verification error' });
  }
};
