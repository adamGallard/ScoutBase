import { supabase } from '@/lib/supabaseClient';

export async function getPendingAwardSubmissions(token, unitId) {
    const response = await fetch(
        `https://achievements.terrain.scouts.com.au/units/${unitId}/submissions?status=pending`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    }
    );
    if (!response.ok) {
        console.error(
            `❌ Failed to fetch pending awards for unit ${unitId}:`,
            await response.text()
        );
        return [];
    }

    const data = await response.json();
    return (data.results || [])
        .filter(sub => sub.submission?.status === 'pending')
        .map(sub => ({
            youthName: `${sub.member.first_name} ${sub.member.last_name}`,
            memberId: sub.member.id,
            badgeType: sub.achievement.type,
            badgeMeta: sub.achievement.achievement_meta,
            dateSubmitted: sub.submission.date,
            status: sub.submission.type,         // e.g. “award”
            submissionId: sub.submission.id,
        }));
}

const siaCache = new Map();
export async function getSIAAchievementsForMember(token, memberId) {
    if (siaCache.has(memberId)) return siaCache.get(memberId);

    const url = `https://achievements.terrain.scouts.com.au/members/${memberId}/achievements?type=special_interest_area`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        console.error('❌ SIA fetch failed for', memberId, await res.text());
        siaCache.set(memberId, []);
        return [];
    }
    const data = await res.json();
    siaCache.set(memberId, data.results ?? []);
    return data.results ?? [];
}

export async function createBadgeOrderRequests(rows, leaderId, groupId) {
    if (!rows?.length) return;

    // 1) map Terrain → ScoutBase
    const memberIds = [...new Set(rows.map(r => r.memberId))];
    const { data: youthRows, error: yErr } = await supabase
        .from('youth')
        .select('id, terrain_id')
        .in('terrain_id', memberIds);
    if (yErr) throw yErr;

    const idLookup = Object.fromEntries(
        youthRows.map(y => [y.terrain_id, y.id])
    );

    // 2) shape and insert
    const inserts = rows.map(r => {
        const scoutbaseId = idLookup[r.memberId];
        if (!scoutbaseId) {
            throw new Error(
                `Youth ${r.youthName} (Terrain ID ${r.memberId}) isn’t in ScoutBase yet – sync them first.`
            );
        }
        return {
            submission_id: r.submissionId,
            youth_id: scoutbaseId,
            badge_type: r.badgeType,
            badge_meta: r.badgeMeta,
            section: r.section,
            project_name: r.projectName || null,
            approved_date: r.approvedDate || null,
            approved_by: r.approvedBy || null,
            status: 'ready_to_order',     // ← new workflow
            group_id: groupId,
            created_by: leaderId,
        };
    });

    const { error } = await supabase
        .from('badge_orders')
        .insert(inserts, { onConflict: 'submission_id' });
    if (error && error.code !== '23505') throw error;
}

/**
 * Fetch both “ready_to_order” and “ordered” records for a group,
 * including their current status so the UI can split them into two tables.
 */
export async function getOrderedBadgesForGroup(groupId) {
    const { data, error } = await supabase
        .from('badge_orders')
        .select(`
      id,
      submission_id,
      section,
      badge_type,
      badge_meta,
      status,
      ordered_date,
      awarded_date,
      youth:youth_id ( name )
    `)
        .eq('group_id', groupId)
        .in('status', ['ready_to_order', 'ordered'])
        .order('ordered_date', { ascending: false });

    if (error) throw error;

    return data.map(r => ({
        ...r,
        youth_name: r.youth?.name ?? '—'
    }));
}

// update a batch of badge_orders rows
export async function updateBadgeOrderStatus(ids, newStatus, dateField) {
    if (!ids.length) return;
    const updates = {
        status: newStatus,
        ...(dateField ? { [dateField]: new Date().toISOString() } : {})
    };
    const { error } = await supabase
        .from('badge_orders')
        .update(updates)
        .in('id', ids);
    if (error) throw error;
}

// call Terrain when we mark awarded
export async function awardInTerrain(token, submissionId) {
    return fetch(
        `https://achievements.terrain.scouts.com.au/submissions/${submissionId}/assessments`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                outcome: 'awarded',
                date_awarded: new Date().toISOString().slice(0, 10)
            })
        }
    );
}
// get everything (all statuses) for this group
export async function getBadgeHistoryForGroup(groupId) {
    const { data, error } = await supabase
        .from('badge_orders')
        .select(`
      id,
      status,
      ordered_date,
      awarded_date,
      badge_type,
      badge_meta,
      youth:youth_id ( name )
    `)
        .eq('group_id', groupId)
        .eq('status', 'awarded')
        .order('ordered_date', { ascending: false });
    if (error) throw error;
    return data.map(r => ({
        ...r,
        youth_name: r.youth?.name || '—'
    }));
}

// get just the awarded badges for one youth
export async function getBadgesForYouth(youthId) {
    const { data, error } = await supabase
        .from('badge_orders')
        .select(`
      badge_type,
      badge_meta,
      awarded_date
    `)
        .eq('youth_id', youthId)
        .eq('status', 'awarded')
        .order('awarded_date', { ascending: false });
    if (error) throw error;
    return data;
}