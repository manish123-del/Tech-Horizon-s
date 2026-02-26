import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(url, anon, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// server-side client, bypasses RLS with service role key
export const supabaseAdmin = createClient(url, serviceRole, {
  auth: {
    persistSession: false
  }
});
