import { supabase } from '@/lib/supabaseClient';
import { hasSectionAccess } from '@/utils/roleUtils';

export const fetchTransitionHistory = async (groupId, section, userInfo) => {
    // First, fetch all youth in group (filtered by section)
    let youthQuery = supabase
        .from('youth')
        .select('id, name, section')
        .eq('group_id', groupId);

    if (section) {
        youthQuery = youthQuery.eq('section', section);
    }

    const { data: youthData, error: youthError } = await youthQuery;
    if (youthError) {
        console.error('Error fetching youth:', youthError);
        return [];
    }

    const youthMap = {};
    const youthIds = (youthData || []).map((y) => {
        youthMap[y.id] = y;
        return y.id;
    });

    // Now fetch transitions for just those youth
    const { data: transitions, error: transitionError } = await supabase
        .from('youth_transitions')
        .select('*')
        .in('youth_id', youthIds);

    if (transitionError) {
        console.error('Error fetching transitions:', transitionError);
        return [];
    }

    // Attach youth details manually
    const enriched = transitions
        .filter(t => {
            if (section && youthMap[t.youth_id]?.section !== section) return false;
            return true;
        })
        .map(t => ({
            id: t.id,
            youth_name: youthMap[t.youth_id]?.name || 'Unknown',
            section: t.section || 'Unknown', // from transition!
            transition_type: t.transition_type,
            date: t.transition_date,
            notes: t.notes
        }));

    // Sort by youth_name (A–Z), then by date descending
    return enriched
        .sort((a, b) => {
            if (a.youth_name < b.youth_name) return -1;
            if (a.youth_name > b.youth_name) return 1;
            return new Date(a.date) - new Date(b.date); // newest first within same name
        });
};
