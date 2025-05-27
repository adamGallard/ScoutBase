import { supabase } from '../lib/supabaseClient';
import { sections, sectionMap, stageMap } from '@/components/common/Lookups.js';



function mapTerrainSection(raw) {
      if (!raw) return '';
      const lc = raw.toLowerCase();
      // try to match code (e.g. "joeys", "cubs") or singular prefix ("joey","cub")
          let found = sections.find(
                s => s.code === lc || s.code.startsWith(lc)
              );
     if (found) return found.label;
      // fallback to matching label exactly
          found = sections.find(s => s.label.toLowerCase() === lc);
      return found ? found.label : raw;
    }

/**
 * Fetches youth members from Terrain for each unit
 */
export async function getYouthFromTerrain(token, units) {
    const allYouth = [];

    for (const unit of units) {
        const response = await fetch(`https://members.terrain.scouts.com.au/units/${unit.unitId}/members`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch members for unit ${unit.unitId}`, await response.text());
            continue;
        }

        const body = await response.json();
        const members = Array.isArray(body.results) ? body.results : [];

        const youthInUnit = members
            .filter(m => m.unit?.duty === 'member')
            .map(m => ({
                terrain_id: m.id,
                name: `${m.first_name} ${m.last_name}`,
                dob: m.date_of_birth,
                section: mapTerrainSection(m.unit?.section),
                member_number: m.member_number,
                status: m.status,
            }));

        allYouth.push(...youthInUnit);
    }

    return allYouth;
}

/**
 * Compares Terrain data with local DB to determine adds and updates
 */

export async function getTerrainSyncPreview(token, groupId, units) {

    console.log('🔁 Starting sync preview for group:', groupId);
    const terrainYouth = await getYouthFromTerrain(token, units);
    console.log(`📥 Received ${terrainYouth.length} youth from Terrain`);

    // Check for duplicate member numbers in Terrain
    const seen = new Set();
    terrainYouth.forEach(y => {
        if (seen.has(y.member_number)) {
            console.warn(`⚠️ Duplicate member number in Terrain: ${y.name} (${y.member_number})`);
        } else {
            seen.add(y.member_number);
        }
    });

    const { data: existingYouth, error } = await supabase
        .from('youth')
        .select('id, terrain_id, name, dob, section, member_number')
        .eq('group_id', groupId);

    const { data: transitions } = await supabase
        .from('youth_transitions')
        .select('youth_id, transition_type, section, transition_date')
        .order('transition_date', { ascending: false });

    if (error) {
        console.error('❌ Failed to fetch youth:', error.message);
        return { toAdd: [], toUpdate: [], missingFromTerrain: [] };
    }

    const transitionMap = {};
    (transitions || []).forEach(t => {
        if (!transitionMap[t.youth_id]) {
            transitionMap[t.youth_id] = t;
        }
    });

    const existing = existingYouth || [];
    const toAdd = [];
    const toUpdate = [];
    const matchedMemberNumbers = new Set();

    for (const terrainY of terrainYouth) {
        terrainY.section = terrainY.section.toLowerCase();
        const isActive = terrainY.status === 'active';

        const match = existing.find(y =>
            y.member_number?.trim() === terrainY.member_number
        ) || existing.find(y =>
            y.name?.trim().toLowerCase() === terrainY.name?.trim().toLowerCase() &&
            y.dob === terrainY.dob
        );

        if (!match) {
            toAdd.push({
                ...terrainY,
                transition_type: isActive ? 'member' : 'retired'
            });
            continue;
        }

        matchedMemberNumbers.add(match.member_number);

        const transition = transitionMap[match.id];

        if (!transition) {
            console.warn(`⚠️ No transition found for youth ID ${match.id} (${match.name})`);
        }
        const currentSectionRaw = transition?.section ?? match.section ?? '';
        const currentSection = typeof currentSectionRaw === 'string' ? currentSectionRaw.toLowerCase() : '';
        if (!currentSectionRaw || typeof currentSectionRaw !== 'string') {
            console.warn(`⚠️ currentSection missing or invalid for youth ${match.name} (${match.id})`);
        }
        const currentSectionRank = sectionMap[currentSection]?.order ?? 0;
        const newSectionRank = sectionMap[terrainY.section]?.order ?? 0;

        const currentStageRaw = transition?.transition_type ?? 'member';
        const currentStage = typeof currentStageRaw === 'string' ? currentStageRaw.toLowerCase() : 'member';

        const currentStageRank = stageMap[currentStage]?.order ?? 0;
        const newStageRank = isActive ? stageMap['member']?.order : stageMap['retired']?.order;

        const fieldChanges = {};
        if (match.name !== terrainY.name) fieldChanges.name = { from: match.name, to: terrainY.name };
        if (match.dob !== terrainY.dob) fieldChanges.dob = { from: match.dob, to: terrainY.dob };
        if (match.section.toLowerCase() !== terrainY.section) fieldChanges.section = { from: match.section, to: terrainY.section };
        if (match.member_number !== terrainY.member_number) fieldChanges.member_number = { from: match.member_number, to: terrainY.member_number };
        if (match.terrain_id !== terrainY.terrain_id) fieldChanges.terrain_id = { from: match.terrain_id, to: terrainY.terrain_id };

        // RULE 3: Skip if current stage is retired
        if (currentStage === 'retired') {
            console.log(`⛔ Skipping ${match.name} – already retired`);
            continue;
        }

        // RULE 4: Skip if section in Terrain < Scoutbase
        if (newSectionRank < currentSectionRank) {
            console.log(`↩️ Skipping ${match.name} – section regressed (${currentSection} → ${terrainY.section})`);
            continue;
        }

        // RULE 5: Skip if stage in Terrain < Scoutbase
        if (newStageRank < currentStageRank) {
            console.log(`⏩ Skipping ${match.name} – stage regressed (${currentStage} → member)`);
            continue;
        }

        // RULE 1: If section advanced, apply linking
        if (newSectionRank > currentSectionRank) {
            toUpdate.push({
                ...terrainY,
                id: match.id,
                transition_type: 'linking',
                fieldChanges
            });
            continue;
        }

        // RULE 2: If section same, and stage increased (e.g. have_a_go → member), apply member
        if (newSectionRank === currentSectionRank && currentStage === 'have_a_go' && isActive) {
            toUpdate.push({
                ...terrainY,
                id: match.id,
                transition_type: 'member',
                fieldChanges: {
                    ...fieldChanges,
                    transition_type: { from: currentStage, to: 'member' }
                }
            });
            continue;
        }

        // RULE 6: If no transition, but fieldChanges exist (e.g. terrain_id), update with default stage
        if (Object.keys(fieldChanges).length > 0) {
            const transition_type = transition ? null : (isActive ? 'member' : 'retired');
            toUpdate.push({
                ...terrainY,
                id: match.id,
                transition_type,
                fieldChanges: {
                    ...fieldChanges,
                    ...(transition_type ? { transition_type: { from: '(none)', to: transition_type } } : {})
                }
            });
        }
    }

    // RULE 8: Find Scoutbase youth missing from Terrain
    const missingFromTerrain = existing.filter(y => !matchedMemberNumbers.has(y.member_number));

	console.log(`🔍 Sync preview complete: ${toAdd} to add, ${toUpdate} to update, ${missingFromTerrain} missing from Terrain`);
    return { toAdd, toUpdate, missingFromTerrain };
}


/**
 * Applies the sync results to Supabase
 */
export async function syncYouthFromTerrain(groupId, toAdd, toUpdate) {
    let added = 0;
    let updated = 0;

    for (const youth of toAdd) {
        const { data, error: insertError } = await supabase
            .from('youth')
            .insert({
                name: youth.name,
                dob: youth.dob,
                section: youth.section,
                member_number: youth.member_number,
                terrain_id: youth.terrain_id,
                group_id: groupId
            })
            .select('id')
            .single();

        if (insertError || !data?.id) {
            console.error('❌ Failed to insert youth:', youth.name, insertError);
            continue;
        }

        await supabase.from('youth_transitions').insert({
            youth_id: data.id,
            transition_type: youth.transition_type.toLowerCase(),
            transition_date: new Date().toISOString().split('T')[0],
            section: youth.section,
            notes: 'Imported from Terrain'
        });

        console.log('✅ Added youth:', youth.name);
        added++;
    }

    for (const youth of toUpdate) {
        const { error: updateError } = await supabase
            .from('youth')
            .update({
                name: youth.name,
                dob: youth.dob,
                section: youth.section,
                member_number: youth.member_number,
                terrain_id: youth.terrain_id
            })
            .eq('id', youth.id);

        if (updateError) {
            console.error('❌ Update failed for:', youth.name, updateError);
            continue;
        }

        const { error: transitionError } = await supabase
            .from('youth_transitions')
            .insert({
                youth_id: youth.id,
                transition_type: youth.transition_type.toLowerCase(),
                transition_date: new Date().toISOString().split('T')[0],
                section: youth.section,
                notes: 'Imported from Terrain'
            });

        if (transitionError) {
            console.error('❌ Transition insert failed for:', youth.name, transitionError.message);
        } else {
            console.log('✅ Transition recorded for:', youth.name);
        }

        updated++;
    }

    return { added, updated };
}

/**
 * Fetch units the user has access to via Terrain profile
 */
export async function getTerrainProfiles(token) {
    const response = await fetch('https://members.terrain.scouts.com.au/profiles', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch profile info');
    }

    const data = await response.json();

    return data.profiles.map(p => ({
        unitId: p.unit.id,
        unitName: p.unit.name,
        section: p.unit.section
    }));
}
