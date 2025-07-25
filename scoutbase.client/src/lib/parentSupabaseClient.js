import { createClient } from '@supabase/supabase-js';
import { getParentSession } from '@/helpers/authHelper';   // <-- import this!

let cachedClient = null;
let cachedToken = null;

export function getParentSupabaseClient() {
    // 🟢 Get the token from the session object, not sessionStorage.getItem('parentToken')
    const { token } = getParentSession();
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON;

    // Only create a new client if the token has changed or there's no cached client
    if (!cachedClient || cachedToken !== token) {
        cachedClient = createClient(url, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
        cachedToken = token;
    }
    return cachedClient;
}
