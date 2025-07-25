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
        .select('youth (id, name, dob, section)')
        .eq('parent_id', parentId);

    if (error) {
        return { error: 'Error fetching youth.' };
    }

    return { youthList: data.map((entry) => entry.youth) };
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