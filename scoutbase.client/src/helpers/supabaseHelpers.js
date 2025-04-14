import { supabase } from '../lib/supabaseClient';

export async function getGroupBySlug(slug) {
    const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('slug', slug)
        .single();
    if (error) throw error;
    return data;
}

export async function getParentBySearch(searchTerm) {
    const { data, error } = await supabase
        .from('parent')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    if (error) throw error;
    return data;
}

export async function getYouthForParent(parentId) {
    const { data, error } = await supabase
        .from('parent_youth')
        .select('youth (id, name, dob, section)')
        .eq('parent_id', parentId);
    if (error) throw error;
    return data.map(entry => entry.youth);
}

export async function insertAttendance(record) {
    const { error } = await supabase.from('attendance').insert([record]);
    if (error) throw error;
}

export async function fetchTransitionsForYouth(youthId) {
    const { data, error } = await supabase
        .from('youth_transitions')
        .select('*')
        .eq('youth_id', youthId)
        .order('transition_date', { ascending: true });

    return { data, error };
}

export async function addYouthTransition(transition) {
    const stage = transition.transition_type; // now identical

    const { data, error } = await supabase
        .from('youth_transitions')
        .insert([{ ...transition}])
        .single();

    if (data?.youth_id && transition.transition_type) {
        await supabase
            .from('youth')
            .update({ membership_stage: transition.transition_type })
            .eq('id', data.youth_id);
    }

    return { data, error };
}
export async function deleteYouthTransition(id) {
    const { error } = await supabase
        .from('youth_transitions')
        .delete()
        .eq('id', id);

    return { error };
}

export async function signout() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}


