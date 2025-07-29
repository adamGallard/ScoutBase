// src/lib/parentSupabaseClient.js

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON;
const supabase = createClient(url, anonKey);

/**
 * Sets or clears the parent JWT (RLS). Use ONLY on login/logout/session restore.
 * @param {string|null} token 
 */
export async function setParentToken(token) {
    if (!token) {
        // Logs out the current session in Supabase's memory
        await supabase.auth.signOut();
        return;
    }
    // Set the JWT for RLS. Only needed ONCE on login or session restore.
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });
}

/**
 * Returns the shared Supabase client.
 */
export function getParentSupabaseClient() {
    return supabase;
}
