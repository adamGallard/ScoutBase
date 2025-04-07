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
