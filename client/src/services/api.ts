import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1'
});

// Automatically attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Global response error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message;
    console.error('[API Error]:', message);
    return Promise.reject(error);
  }
);

export default api;
