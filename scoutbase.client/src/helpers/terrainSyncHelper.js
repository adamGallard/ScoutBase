import { supabase } from '../lib/supabaseClient';
import { sections } from '@/components/common/Lookups.js';

    // build a label→order map from your lookup
    const sectionOrder = sections.reduce((acc, s) => {
          acc[s.label] = s.order;
          return acc;
        }, {});

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

    const { data: existingYouth, error } = await supabase
        .from('youth')
        .select('id, terrain_id, name, dob, section, member_number')
        .eq('group_id', groupId);

    if (error) {
        console.error('❌ Failed to fetch existing youth:', error.message);
        return { toAdd: terrainYouth, toUpdate: [] };
    }

    const existing = existingYouth || [];
    const toAdd = [];
    const toUpdate = [];

    for (const terrainY of terrainYouth) {
                // the terrainY.section comes in as a raw string; normalize to your label
                    terrainY.section = mapTerrainSection(terrainY.section);
                           let match = existing.find(y =>
                            y.member_number?.trim() === terrainY.member_number
                        );

        if (!match) {
            match = existing.find(y =>
                y.name?.trim().toLowerCase() === terrainY.name?.trim().toLowerCase() &&
                y.dob === terrainY.dob
            );
        }

        if (!match) {
            toAdd.push({
                ...terrainY,
                transition_type: terrainY.status === 'active' ? 'Invested' : 'Retired'
            });
        } else {
            const hasChanges =
                match.name !== terrainY.name ||
                match.dob !== terrainY.dob ||
                match.section !== terrainY.section;

            if (hasChanges) {
                const prevRank = sectionOrder[match.section] || 0;
                const newRank = sectionOrder[terrainY.section] || 0;

                if (prevRank && newRank && newRank < prevRank) {
                    console.warn(`🚫 Skipping backwards transition for ${match.name}: ${match.section} → ${terrainY.section}`);
                    continue;
                }

                const transitionType = (newRank > prevRank) ? 'Linking' : 'Invested';

                toUpdate.push({
                    ...terrainY,
                    id: match.id,
                    transition_type: transitionType
                });
            }
        }
    }

    return { toAdd, toUpdate };
}

/**
 * Applies the sync results to Supabase
 */
export async function syncYouthFromTerrain(groupId, toAdd, toUpdate) {
    let added = 0;
    let updated = 0;

    const { data: existingYouth, error } = await supabase
        .from('youth')
        .select('id, terrain_id, name, dob, section, member_number')
        .eq('group_id', groupId);

    if (error) {
        console.error('❌ Failed to fetch existing youth:', error.message);
        return { added, updated };
    }

    // Add new youth
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
            transition_type: youth.transition_type,
            transition_date: new Date().toISOString().split('T')[0],
            section: youth.section,
            notes: 'Imported from Terrain'
        });

        console.log('✅ Added youth:', youth.name);
        added++;
    }

    // Update existing youth
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
                transition_type: youth.transition_type,
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
