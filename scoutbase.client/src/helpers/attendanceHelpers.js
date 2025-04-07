import { supabase } from '../lib/supabaseClient';

export const submitAttendance = async ({ action, youth_id, parentName, comment, groupId }) => {
    const timestamp = new Date();
    const { error } = await supabase.from('attendance').insert([{
        action,
        signed_by: parentName,
        event_date: timestamp.toISOString().split('T')[0],
        timestamp: timestamp.toISOString(),
        youth_id,
        comment,
        group_id: groupId
    }]);
    return { error, timestamp };
};
