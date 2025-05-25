/**
 * Fetch pending award submissions for a given unit
 * Only includes submissions with `type: "award"` and `status: "pending"`
 */
import { supabase } from '@/lib/supabaseClient';   // make sure this path is correct!

export async function getPendingAwardSubmissions(token, unitId) {
    const response = await fetch(`https://achievements.terrain.scouts.com.au/units/${unitId}/submissions?status=pending`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.error(`❌ Failed to fetch pending awards for unit ${unitId}:`, await response.text());
        return [];
    }

    const data = await response.json();
	//console.log('✅ Fetched pending awards:', data.results);
    // Filter for award submissions only (not reviews)
    const pendingAwards = data.results
        .filter(sub => //sub.submission?.type === 'award' && 
            sub.submission?.status === 'pending')
        .map(sub => ({
            youthName: `${sub.member.first_name} ${sub.member.last_name}`,
            memberId: sub.member.id,
            badgeType: sub.achievement.type,
            badgeMeta: sub.achievement.achievement_meta,
            dateSubmitted: sub.submission.date,
            badgeId: sub.achievement.id,
			status: sub.submission.type,
            submissionId: sub.submission.id,
        }));

    return pendingAwards;
}
const siaCache = new Map(); // key: memberId  →  value: Array<achievement>

export async function getSIAAchievementsForMember(token, memberId) {
    if (siaCache.has(memberId)) return siaCache.get(memberId);

    const url = `https://achievements.terrain.scouts.com.au/members/${memberId}/achievements?type=special_interest_area`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) {
        console.error('❌ SIA fetch failed for', memberId, await res.text());
        siaCache.set(memberId, []);         // avoid re-fetch loops
        return [];
    }

    const data = await res.json();
    siaCache.set(memberId, data.results ?? []);
	//console.log('✅ Fetched SIA achievements for', memberId, data.results);
    return data.results ?? [];
}

export async function createBadgeOrderRequests(rows, leaderId, groupId) {
    if (!rows?.length) return;

    /* 1 ▸ Terrain → ScoutBase lookup */
    const memberIds = [...new Set(rows.map(r => r.memberId))];

    const { data: youthRows, error: yErr } = await supabase
        .from('youth')
        .select('id, terrain_id')
        .in('terrain_id', memberIds);

    if (yErr) throw yErr;

    const idLookup = Object.fromEntries(
        youthRows.map(y => [y.terrain_id, y.id])
    );

    /* 2 ▸ shape rows */
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
            status: 'pending',
            group_id: groupId,
            created_by: leaderId,
        };
    });

    /* 3 ▸ insert – ignore duplicates on submission_id */
    const { error } = await supabase
        .from('badge_orders')
        .insert(inserts, { onConflict: 'submission_id' }); // OK with supabase-js v2

    if (error && error.code !== '23505') throw error;
}
// terrainBadgesHelper.js
export async function getOrderedBadgesForGroup(groupId) {
    const { data, error } = await supabase
        .from('badge_orders')
        .select(`
      id,
      submission_id,
      section,
      badge_type,
      badge_meta,
      ordered_date,
      youth:youth_id ( name )      -- 🔸 pull the single name column
    `)
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('ordered_date', { ascending: false });

    if (error) throw error;
	console.log('✅ Fetched ordered badges for group:', groupId, data);
    // flatten
    return data.map(r => ({
        ...r,
        youth_name: r.youth ? r.youth.name : '—'
    }));
}