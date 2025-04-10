import { supabase } from '../lib/supabaseClient';

export const fetchGroupBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('groups')
        .select('id, name, active') // must include active!
        .eq('slug', slug)
        .single();
    return { data, error };
};

export async function fetchPrimaryLeaderEmail(groupId) {
    const { data, error } = await supabase
        .from('users') // or group_leaders
        .select('email')
        .eq('group_id', groupId)
        .eq('Group_Primary', true)
        .limit(1)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching primary leader email:', error);
        return null;
    }

    if (!data || data.length === 0) {
        console.warn('No primary leader found for group:', groupId);
        return null;
    }
    // Assuming data is an array and we want the first item

    return data[0]?.email || null;
}