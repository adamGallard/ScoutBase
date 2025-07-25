import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabaseClientWithToken(token) {
    if (!supabaseClient) {
        supabaseClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON
        );
    }
    if (token) {
        supabaseClient.auth.setAuth(token);
    }
    return supabaseClient;
}
export const supabase = getSupabaseClientWithToken();