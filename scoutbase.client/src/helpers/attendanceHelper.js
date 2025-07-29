// src/helpers/attendanceHelper.js

import { getParentSession } from '@/helpers/authHelper';
import { getParentSupabaseClient } from '@/lib/parentSupabaseClient';

/**
 * Fetch youth records linked to a parent.
 * @param {string} parentId 
 * @param {string} [token] (optional, will pull from session if not provided)
 * @returns {Promise<{youthList: array, error: any}>}
 */
export async function fetchYouthByParentId(parentId, token) {
    if (!token) {
        // fallback to session (for backward compatibility)
        token = getParentSession()?.token;
    }
    if (!token || !parentId) return { youthList: [], error: 'Not authenticated' };

    const supabase = getParentSupabaseClient(token); // <-- token forwarding (see below)
    const { data, error } = await supabase
        .from('parent_youth')
        .select('is_primary, youth(id, name, dob, section)')
        .eq('parent_id', parentId);

    if (error) {
        console.error('[fetchYouthByParentId] DB error:', error);
        return { youthList: [], error };
    }

    // Filter out rows with missing youth (should not happen)
    const youthList = (data || [])
        .filter(row => row.youth && row.youth.id)
        .map(row => ({
            ...row.youth,
            is_primary: row.is_primary,
        }));

    return { youthList, error: null };
}

/**
 * Get latest attendance records for all youth in a group.
 * @param {array} youthList 
 * @param {string} groupId 
 * @param {string} [token]
 * @returns {Promise<object>} youthId -> latest attendance row
 */
export async function fetchLatestAttendanceForYouthList(youthList, groupId, token) {
    if (!token) token = getParentSession()?.token;
    const ids = (Array.isArray(youthList) ? youthList : []).map(y => y && y.id).filter(Boolean);

    if (!token || !groupId || ids.length === 0) return {};

    const supabase = getParentSupabaseClient(token);

    const { data, error } = await supabase
        .from('attendance')
        .select('id, youth_id, action, timestamp')
        .in('youth_id', ids)
        .eq('group_id', groupId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('[fetchLatestAttendanceForYouthList] DB error:', error);
        return {};
    }

    // Map to youth_id -> latest attendance
    const latest = {};
    for (const row of data || []) {
        if (!latest[row.youth_id]) {
            latest[row.youth_id] = row;
        }
    }
    return latest;
}

/**
 * Insert new attendance record
 * @param {object} row 
 * @param {string} [token]
 * @returns {Promise<{error: any}>}
 */
export async function insertAttendance(row, token) {
    if (!token) token = getParentSession()?.token;
    const supabase = getParentSupabaseClient(token);
    const { error } = await supabase.from('attendance').insert([row]);
    if (error) {
        console.error('[insertAttendance] Error:', error);
    }
    return { error };
}
