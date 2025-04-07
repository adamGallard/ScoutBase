import { supabase } from '../lib/supabaseClient';

export const recordAttendance = async (youthId, action, comment, groupId, parentName) => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase.from('attendance').insert([
        {
            action,
            signed_by: parentName,
            event_date: timestamp.split('T')[0],
            timestamp,
            youth_id: youthId,
            comment,
            group_id: groupId,
        },
    ]);

    return { success: !error, error };
};
