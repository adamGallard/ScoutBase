import { supabase } from '../lib/supabaseClient';

export const fetchGroupBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('groups')
        .select('id, name, active') // must include active!
        .eq('slug', slug)
        .single();
    return { data, error };
};