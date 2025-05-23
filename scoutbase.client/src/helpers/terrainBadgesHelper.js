/**
 * Fetch pending award submissions for a given unit
 * Only includes submissions with `type: "award"` and `status: "pending"`
 */
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