import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import api from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          // Direct Supabase profile sync fallback (guarantees profile exists immediately)
          try {
            const user = session.user;
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Student';
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
            await supabase.from('profiles').upsert({
              id: user.id,
              email: user.email!,
              full_name: fullName,
              avatar_url: avatarUrl
            }, { onConflict: 'id' });
          } catch (profileErr) {
            console.warn('[AUTH CALLBACK] Direct Supabase profile sync notice:', profileErr);
          }

          // Synchronize profile with FLOW backend non-blockingly (so network errors or sleeping backends don't fail login)
          api.post('/auth/sync').catch((syncErr) => {
            console.warn('[AUTH CALLBACK] Backend profile sync postponed or offline:', syncErr?.message);
          });

          navigate('/dashboard', { replace: true });
        } else {
          // If no session found yet, subscribe briefly to auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
              try {
                const user = session.user;
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Student';
                const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
                await supabase.from('profiles').upsert({
                  id: user.id,
                  email: user.email!,
                  full_name: fullName,
                  avatar_url: avatarUrl
                }, { onConflict: 'id' });
              } catch (profileErr) {
                console.warn('[AUTH CALLBACK] Direct Supabase profile sync notice:', profileErr);
              }

              api.post('/auth/sync').catch((syncErr) => {
                console.warn('[AUTH CALLBACK] Backend profile sync postponed or offline:', syncErr?.message);
              });

              subscription.unsubscribe();
              navigate('/dashboard', { replace: true });
            }
          });

          // Fallback timeout if session fails to establish
          setTimeout(() => {
            subscription.unsubscribe();
            setErrorMsg('Authentication session could not be retrieved. Please try logging in again.');
          }, 6000);
        }
      } catch (err: any) {
        console.error('[OAUTH CALLBACK ERROR]:', err);
        setErrorMsg(err?.message || 'Failed to complete authentication.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
          <p className="text-sm text-slate-400">{errorMsg}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-all shadow-lg text-sm"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return <LoadingSpinner fullPage text="Completing Google sign in & synchronizing profile..." />;
};
export default AuthCallback;
