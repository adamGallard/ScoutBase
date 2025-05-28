import { supabase } from '../lib/supabaseClient';
import { sections, sectionMap, stageMap } from '@/components/common/Lookups.js';

/**
 * Maps Terrain's section string to our label.
 */
function mapTerrainSection(raw) {
    if (!raw) return '';
    const lc = raw.toLowerCase();
    let found = sections.find(s => s.code === lc || s.code.startsWith(lc));
    if (found) return found.label;
    found = sections.find(s => s.label.toLowerCase() === lc);
    return found ? found.label : raw;
}

/**
 * Fetches youth members from Terrain for each unit
 */
export async function getYouthFromTerrain(token, units) {
    const allYouth = [];
    for (const unit of units) {
        const resp = await fetch(
            `https://members.terrain.scouts.com.au/units/${unit.unitId}/members`,
            { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resp.ok) {
            console.error(`Failed to fetch members for unit ${unit.unitId}`, await resp.text());
            continue;
        }
        const body = await resp.json();
        const members = Array.isArray(body.results) ? body.results : [];
        const youth = members
            .filter(m => m.unit?.duty === 'member')
            .map(m => ({
                terrain_id: m.id,
                name: `${m.first_name} ${m.last_name}`,
                dob: m.date_of_birth,
                section: mapTerrainSection(m.unit?.section).toLowerCase(),
                member_number: m.member_number,
                status: m.status
            }));
        allYouth.push(...youth);
    }
    return allYouth;
}

/**
 * Fetches the user's Terrain profiles (units)
 */
export async function getTerrainProfiles(token) {
    const resp = await fetch('https://members.terrain.scouts.com.au/profiles', {
        method: 'GET', headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Failed to fetch profile info');
    const data = await resp.json();
    return data.profiles.map(p => ({
        unitId: p.unit.id,
        unitName: p.unit.name,
        section: p.unit.section
    }));
}

/** Helpers for sync preview **/
async function fetchExistingYouth(groupId) {
    const { data, error } = await supabase
        .from('youth')
        .select('id, terrain_id, name, dob, section, member_number')
        .eq('group_id', groupId);
    if (error) throw error;
    return data;
}

async function fetchLatestTransitions() {
    const { data, error } = await supabase
        .from('youth_transitions')
        .select('youth_id, transition_type, section, transition_date')
        .order('transition_date', { ascending: false });
    if (error) throw error;

    // Group transitions by youth_id
    const grouped = {};
    data.forEach(t => {
        if (!grouped[t.youth_id]) grouped[t.youth_id] = [];
        grouped[t.youth_id].push(t);
    });

    // Pick latest per youth: sort by date desc, then section rank, then stage rank
    const map = {};
    Object.entries(grouped).forEach(([youthId, transitions]) => {
        transitions.sort((a, b) => {
            const da = new Date(a.transition_date);
            const db = new Date(b.transition_date);
            if (db - da) return db - da; // later date first
            const oa = sectionMap[a.section]?.order ?? -1;
            const ob = sectionMap[b.section]?.order ?? -1;
            if (ob - oa) return ob - oa;     // higher section rank first
            const sa = stageMap[a.transition_type]?.order ?? -1;
            const sb = stageMap[b.transition_type]?.order ?? -1;
            return sb - sa;                 // higher stage rank first
        });
        map[youthId] = transitions[0];
    });

    return map;
}


function decideSyncAction({ sectionDelta, stageDelta, isRetired,isLinking,hasFields }) {


    if (isRetired) {
      //  console.log(`→ SKIP (already retired)`);
     //   console.groupEnd();
        return { type: 'SKIP', reason: 'already retired' };
    }
    // If they’re mid-linking, ignore Terrain still showing the old section
      if (sectionDelta < 0 && isLinking) {
      //     console.log(`→ SKIP (linking in progress, ignore section regression)`);
      //      console.groupEnd();
            return { type: 'SKIP', reason: 'linking in progress' };
          }
    
         if (sectionDelta < 0) {
          //      console.log(`→ SKIP (section regressed)`);
          //      console.groupEnd();
                return { type: 'SKIP', reason: 'section regressed' };
    }

    if (sectionDelta === 0 && stageDelta > 0) {
       // console.log(`→ TRANSITION_AND_FIELDS (member) – stage advanced`);
//console.groupEnd();
        return { type: 'TRANSITION_AND_FIELDS', transition: 'member', reason: 'stage advanced' };
    }
    if (sectionDelta < 0) {
      //  console.log(`→ SKIP (section regressed)`);
       // console.groupEnd();
        return { type: 'SKIP', reason: 'section regressed' };
    }
    if (hasFields) {
     //   console.log(`→ UPDATE_FIELDS (field changes only)`);
      //  console.groupEnd();
        return { type: 'UPDATE_FIELDS', reason: 'field changes only' };
    }
    if (stageDelta < 0) {
     //   console.log(`→ SKIP (stage regressed)`);
//console.groupEnd();
        return { type: 'SKIP', reason: 'stage regressed' };
    }
//console.log(`→ SKIP (no changes)`);
   // console.groupEnd();
    return { type: 'SKIP', reason: 'no changes' };
}

function computeDiffs(match, terrainRec, transition) {
    const sectionRank = Object.fromEntries(
        Object.entries(sectionMap).map(([k, v]) => [k, v.order])
    );
    const stageRank = Object.fromEntries(
        Object.entries(stageMap).map(([k, v]) => [k, v.order])
    );
    const curTrans = transition || {};
    const curSecRank = sectionRank[(curTrans.section || match.section).toLowerCase()] ?? -1;
    const newSecRank = sectionRank[terrainRec.section] ?? -1;
    const curStageRank = stageRank[(curTrans.transition_type || 'member').toLowerCase()] ?? -1;
    const newStageRank = terrainRec.status === 'active' ? stageRank['member'] : stageRank['retired'];
    

    const fieldChanges = {};
    // Build detailed fieldChanges
    const isLinking = (curTrans.transition_type || '').toLowerCase() === 'linking';

    if (match.name !== terrainRec.name) {
        fieldChanges.name = { from: match.name, to: terrainRec.name };
    }
    if (match.dob !== terrainRec.dob) {
        fieldChanges.dob = { from: match.dob, to: terrainRec.dob };
    }
	//console.log(isLinking, curTrans, match.section, terrainRec.section);
    if (!isLinking && match.section.toLowerCase() !== terrainRec.section) {
        fieldChanges.section = { from: match.section, to: terrainRec.section };
    }
    if ((match.member_number || '') !== (terrainRec.member_number || '')) {
            fieldChanges.member_number = { from: match.member_number, to: terrainRec.member_number };
     }
    if ((match.terrain_id || '') !== (terrainRec.terrain_id || '')) {
        fieldChanges.terrain_id = { from: match.terrain_id, to: terrainRec.terrain_id };
    }
    const hasFields = Object.keys(fieldChanges).length > 0;

     return {
        sectionDelta: newSecRank - curSecRank,
        stageDelta: newStageRank - curStageRank,
        isRetired: curTrans.transition_type === 'retired',
        hasFields,
        isLinking,
        fieldChanges
    };
}

function findMatch(rec, existing) {
    const byId = existing.find(y => y.terrain_id?.trim() === rec.terrain_id);
    const byNum = existing.find(y => y.member_number?.trim() === rec.member_number);
    if (byId || byNum) return byId || byNum;
    return existing.find(y => {
        const n1 = y.name.trim().toLowerCase();
        const n2 = rec.name.trim().toLowerCase();
        const d1 = new Date(y.dob).toISOString().split('T')[0];
        const d2 = new Date(rec.dob).toISOString().split('T')[0];
        return n1 === n2 && d1 === d2;
    });
}

/**
 * Previews what will be added or updated without writing to DB
 */
export async function getTerrainSyncPreview(token, groupId, units) {
    const terrain = await getYouthFromTerrain(token, units);
    const existing = await fetchExistingYouth(groupId);
    const transitions = await fetchLatestTransitions();

    const toAdd = [];
    const toUpdate = [];

    for (const rec of terrain) {
        const match = findMatch(rec, existing);
        if (!match) {
            toAdd.push({ ...rec, transition_type: rec.status === 'active' ? 'member' : 'retired' });
            continue;
        }
        const diffs = computeDiffs(match, rec, transitions[match.id]);
        const decision = decideSyncAction(diffs);
        if (decision.type === 'SKIP') continue;
        const previewPayload = {
            ...rec,
            id: match.id,
            transition_type: decision.transition,
            fieldChanges: diffs.fieldChanges,
            reason: decision.reason
        };
        console.log('📝 Preview payload for modal:', previewPayload);
        toUpdate.push(previewPayload);
    }

    return { toAdd, toUpdate };
}

/**
 * Applies the sync to Supabase (only changed fields)
 */
export async function syncYouthFromTerrain(groupId, toAdd, toUpdate) {
    let added = 0, updated = 0;
    // Inserts
    for (const y of toAdd) {
        const { data, error } = await supabase.from('youth').insert({
            name: y.name,
            dob: y.dob,
            section: y.section,
            member_number: y.member_number,
            terrain_id: y.terrain_id,
            group_id: groupId
        }).select('id').single();
        if (!data?.id || error) continue;
        await supabase.from('youth_transitions').insert({
            youth_id: data.id,
            transition_type: y.transition_type.toLowerCase(),
            transition_date: new Date().toISOString().split('T')[0],
            section: y.section,
            notes: 'Imported from Terrain'
        });
        added++;
    }

    // Updates with only changed fields
    for (const y of toUpdate) {
        const updateData = {};


        if (y.fieldChanges.name) updateData.name = y.name;
        if (y.fieldChanges.dob) updateData.dob = y.dob;
        if (y.fieldChanges.member_number) updateData.member_number = y.member_number;
        if (y.fieldChanges.terrain_id) updateData.terrain_id = y.terrain_id;

        if (Object.keys(updateData).length) {
            await supabase.from('youth')
                .update(updateData)
                .eq('id', y.id);
        }

           // if section changed, schedule it as a 'linking' transition
              if (y.fieldChanges.section) {
                  y.transition_type = 'linking';
                   }

        if (y.transition_type) {
            await supabase.from('youth_transitions').insert({
                youth_id: y.id,
                transition_type: y.transition_type.toLowerCase(),
                transition_date: new Date().toISOString().split('T')[0],
                section: y.section,
                notes: 'Imported from Terrain'
            });
        }

        updated++;
    }

    return { added, updated };
}
