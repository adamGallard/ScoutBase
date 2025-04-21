import { supabase } from '@/lib/supabaseClient';
import { hasSectionAccess } from '@/utils/roleUtils';

export const fetchTransitionHistory = async (groupId, section, userInfo) => {
    let query = supabase
        .from('youth_transitions')
        .select(`id, transition_type, transition_date, notes, youth_id, youth(name, section, group_id)`)
        .filter('youth.group_id', 'eq', groupId); // ✅ filter on joined table field

    // Role-based section filtering
    if (hasSectionAccess(userInfo)) {
        query = query.eq('youth.section', userInfo.section);
    } else if (section) {
        query = query.eq('youth.section', section);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching transition history:', error);
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        youth_name: row.youth?.name || 'Unknown',
        section: row.youth?.section || 'Unknown',
        transition_type: row.transition_type,
        date: row.transition_date, // 🔁 updated to match actual field name
        notes: row.notes
    }));
};
