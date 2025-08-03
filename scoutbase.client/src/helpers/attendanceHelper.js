import { supabase } from '../lib/supabaseClient';
import { verifyPin } from './authHelper';

export const searchParentByNameOrPhone = async (searchTerm, pin, groupId) => {
    const { data, error } = await supabase
        .from('parent')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .eq('group_id', groupId); //  restrict by group

    if (error || !data || data.length === 0) {
        return { error: 'Invalid name or PIN. Please try again.' };
    }

    const parent = data[0];
    const isValid = await verifyPin(pin, parent.pin_hash);

    if (!isValid) {
        return { error: 'Invalid name or PIN. Please try again.' };
    }

    return { parent };
};


export const fetchYouthByParentId = async (parentId) => {
    const { data, error } = await supabase
        .from('parent_youth')
        .select(`
            youth: youth_id (*),
            is_primary
        `)
        .eq('parent_id', parentId);

    if (error) {
        return { error: 'Error fetching youth.' };
    }

    // Filter out any with missing youth
    const youthList = (data || [])
        .filter(entry => entry.youth && entry.youth.id && entry.youth.name)
        .map(entry => ({
            ...entry.youth,
            is_primary: entry.is_primary
        }));

    return { youthList };
};


export async function fetchLatestAttendanceForYouthList(youthList, groupId) {
    const today = new Date().toISOString().split("T")[0];
    const statuses = {};

    for (const youth of youthList) {
        const { data, error } = await supabase
            .from("attendance")
            .select("*")
            .eq("youth_id", youth.id)
            .eq("group_id", groupId)
            .gte("timestamp", `${today}T00:00:00`)
            .order("timestamp", { ascending: false })
            .limit(1);

        if (!error && data.length > 0) {
            statuses[youth.id] = data[0];
        }
    }

    return statuses;
}

export async function fetchSignersForPrimaryChildren(parentId) {
    // Get primary youth for this parent
    const { data: primaryLinks, error } = await supabase
        .from('parent_youth')
        .select('youth: youth_id (id, name)')
        .eq('parent_id', parentId)
        .eq('is_primary', true);

    if (error || !primaryLinks) return [];

    // For each, fetch all parents linked to that youth
    const results = [];
    for (const link of primaryLinks) {
        const { data: parentLinks } = await supabase
            .from('parent_youth')
            .select('parent:parent_id (id, name, phone, email)')
            .eq('youth_id', link.youth.id);

        results.push({
            youth: link.youth,
            parents: parentLinks.map(p => p.parent)
        });
    }
    return results;
}
export async function fetchLatestHelperAttendance(parentId, groupId) {
    const today = new Date().toISOString().split("T")[0];
    const statuses = {};

    const { data, error } = await supabase
        .from("helper_attendance")
        .select("*")
        .eq("parent_id", parentId)
        .eq("group_id", groupId)
        .gte("timestamp", `${today}T00:00:00`)
        .order("timestamp", { ascending: false })
        .limit(1);


    if (!error && data.length > 0) {
        statuses[parentId] = data[0];
    }


return statuses;
}