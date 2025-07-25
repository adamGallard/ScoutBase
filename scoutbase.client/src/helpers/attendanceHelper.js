import { getParentSession } from '@/helpers/authHelper';
import { getParentSupabaseClient } from '@/lib/parentSupabaseClient';

// Get youth linked to this parent
export async function fetchYouthByParentId(parentId) {

    const { token } = getParentSession();
    if (!token || !parentId) return { youthList: [], error: 'Not authenticated' };

    const supabase = getParentSupabaseClient();
    const { data, error } = await supabase
        .from('parent_youth')
        .select('youth(id, name, dob, section)')
        .eq('parent_id',
            parentId);

    return { youthList: data?.map((row) => row.youth).filter(Boolean) || [], error };
	
}

// Get latest attendance for all these youth in this group
export async function fetchLatestAttendanceForYouthList(youthList, groupId) {
    const { token } = getParentSession();
    const ids = (Array.isArray(youthList) ? youthList : []).map(y => y && y.id).filter(Boolean);

    if (!token || !groupId || ids.length === 0)
        return {};

	const supabase = getParentSupabaseClient();

    const { data, error } = await supabase
        .from('attendance')
        .select('id, youth_id, action, timestamp')
        .in('youth_id', ids)
        .eq('group_id', groupId)
        .order('timestamp', { ascending: false });

    // Map to youth_id -> latest attendance
    const latest = {};
    if (data) {
        for (const row of data) {
            if (!latest[row.youth_id]) {
                latest[row.youth_id] = row;
            }
        }
    }
    return latest;
}

export async function insertAttendance(row) {
    const supabase = getParentSupabaseClient();
    const { error } = await supabase.from('attendance').insert([row]);
    return { error };
}
