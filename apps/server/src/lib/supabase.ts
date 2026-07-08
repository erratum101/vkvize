import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
}

export const supabaseAdmin = createClient(url || '', serviceKey || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'quiz-images';
