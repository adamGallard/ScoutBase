import { supabase } from '../lib/supabaseClient';
import { logAuditEvent } from './auditHelper';
import bcrypt from 'bcryptjs';

export async function getGroupBySlug(slug) {
    const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('slug', slug)
        .single();
    if (error) throw error;
    return data;
}

export async function getParentBySearch(searchTerm) {
    const { data, error } = await supabase
        .from('parent')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    if (error) throw error;
    return data;
}

export async function getYouthForParent(parentId) {
    const { data, error } = await supabase
        .from('parent_youth')
        .select('youth (id, name, dob, section)')
        .eq('parent_id', parentId);
    if (error) throw error;
    return data.map(entry => entry.youth);
}

export async function insertAttendance(record) {
    const { error } = await supabase.from('attendance').insert([record]);
    if (error) throw error;
}

export async function fetchTransitionsForYouth(youthId) {
    const { data, error } = await supabase
        .from('youth_transitions')
        .select('*')
        .eq('youth_id', youthId)
        .order('transition_date', { ascending: true });

    return { data, error };
}

export async function addYouthTransition(transition) {
    const stage = transition.transition_type; // now identical

    const { data, error } = await supabase
        .from('youth_transitions')
        .insert([{ ...transition}])
        .single();

    if (data?.youth_id && transition.transition_type) {
        await supabase
            .from('youth')
            .update({ membership_stage: transition.transition_type })
            .eq('id', data.youth_id);
    }

    return { data, error };
}
export async function deleteYouthTransition(id) {
    const { error } = await supabase
        .from('youth_transitions')
        .delete()
        .eq('id', id);

    return { error };
}

export async function signout() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}


export async function getCurrentAdminUser() {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, name, role, group_id')
        .eq('id', authUser.id)
        .single();

    if (profileError) throw profileError;

    return {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        group_id: profile.group_id,
    };
}


export async function handleYouthImportLogic(data, groupId, filename) {
    const { youthData, transitionData, parentData } = transformImportRows(data, filename);

    // 1. Upsert youth by member_number + group_id
    const { error: youthUpsertError } = await supabase.from('youth').upsert(
        youthData.map((y) => ({
            ...y,
            group_id: groupId
        })),
        { onConflict: ['member_number', 'group_id'] }
    );
    if (youthUpsertError) throw new Error('Failed to upsert youth: ' + youthUpsertError.message);

    // 2. Get all youth with their IDs
    const { data: existingYouth, error: youthFetchError } = await supabase
        .from('youth')
        .select('id, member_number')
        .eq('group_id', groupId);
    if (youthFetchError) throw new Error('Failed to fetch youth IDs');

    const youthIdMap = Object.fromEntries(existingYouth.map((y) => [y.member_number, y.id]));

    // 3. Batch insert transitions (filter out invalid)
    const validTransitions = transitionData
        .map((t) => {
            const youth_id = youthIdMap[t.member_number];
            if (!youth_id || !t.date || !t.type || !t.section) return null;
            return {
                youth_id,
                transition_type: t.type,
                section: t.section,
                transition_date: t.date,
                notes: t.notes || `Imported from ${filename}`,
            };
        })
        .filter(Boolean);

    if (validTransitions.length > 0) {
        const { error: transitionInsertError } = await supabase
            .from('youth_transitions')
            .insert(validTransitions);
        if (transitionInsertError) {
            console.error('❌ Failed to insert transitions:', transitionInsertError.message);
        }
    }

    // 4. Upsert parents and create parent_youth links
    const parentYouthLinks = [];

    for (const p of parentData) {
        const cleanEmail = p.email?.trim() || null;
        const cleanPhoneNumber = cleanPhone(p.contact_number);
        let existing = null;

        // Match on email
        if (cleanEmail) {
            const { data } = await supabase
                .from('parent')
                .select('id')
                .eq('group_id', groupId)
                .eq('email', cleanEmail)
                .maybeSingle();
            existing = data;
        }

        // Match on phone if not found
        if (!existing && cleanPhoneNumber) {
            const { data } = await supabase
                .from('parent')
                .select('id')
                .eq('group_id', groupId)
                .eq('phone', cleanPhoneNumber)
                .maybeSingle();
            existing = data;
        }

        let parentId = existing?.id;

        // Insert parent if new
        if (!parentId) {
            const defaultPIN = '1258';
            const hashedPIN = await bcrypt.hash(defaultPIN, 10);

            const { data: inserted, error: parentInsertError } = await supabase
                .from('parent')
                .insert({
                    name: p.name?.trim() || 'Unknown',
                    email: cleanEmail,
                    phone: cleanPhoneNumber,
                    group_id: groupId,
                    pin_hash: hashedPIN,
                })
                .select()
                .single();

            if (parentInsertError || !inserted) {
                console.error('❌ Failed to insert parent:', parentInsertError?.message || 'unknown', p);
                continue;
            }            
        };

        // Link to youth if valid
        const youth_id = youthIdMap[p.linked_member_number];
        if (!youth_id) {
            console.warn('⚠️ No youth ID for parent link:', p);
            continue;
        }

        // Avoid duplicate links
        const { data: existingLink } = await supabase
            .from('parent_youth')
            .select('id')
            .eq('parent_id', parentId)
            .eq('youth_id', youth_id)
            .maybeSingle();

        if (!existingLink) {
            parentYouthLinks.push({
                parent_id: parentId,
                youth_id,
                group_id: groupId,
                is_primary: p.is_primary || false,
            });
        }
    }

    if (parentYouthLinks.length > 0) {
        const { error: linkInsertError } = await supabase
            .from('parent_youth')
            .insert(parentYouthLinks);
        if (linkInsertError) {
            console.error('❌ Failed to insert parent-youth links:', linkInsertError.message);
        }
    }

    // 5. Log audit event
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
        user_admin_id: user?.user?.id || null,
        group_id: groupId,
        role: 'admin',
        action: 'Excel_import',
        target_type: 'youth',
        target_id: null,
        metadata: {
            source_file: filename,
            imported: youthData.length,
            transitions: transitionData.length,
            parents: parentData.length
        }
    });

    return {
        success: true,
        summary: {
            youthImported: youthData.length,
            transitionsAdded: validTransitions.length,
            parentLinks: parentYouthLinks.length,
            parentsProcessed: parentData.length
        }
    };
}

function transformImportRows(rows, filename) {
    const sectionOrder = ['Joeys', 'Cubs', 'Scouts', 'Venturers', 'Rovers'];
    const youthData = [];
    const transitionData = [];
    const parentData = [];



    for (const row of rows) {
                const member_number = String(row.member_number || '').trim();
        const name = String(row.name || '').trim();
        if (!member_number || !name) continue;
        const dob = normalizeDate(row.dob);
        const resigned = normalizeDate(row.resigned);

        const transitions = [];
        sectionOrder.forEach((section) => {
            const field = `joined_${section.toLowerCase()}`;
            const parsedDate = normalizeDate(row[field]);

            if (parsedDate) {
                transitions.push({
                    member_number,
                    type: 'Invested',
                    section,
                    date: parsedDate,
                    notes: `Imported from ${filename}`
                });
            }
        });
        const lastSection = transitions.length > 0
            ? transitions[transitions.length - 1].section
            : null;

        if (resigned && transitions.length) {
            transitions.push({
                member_number,
                type: 'Retired',
                section: lastSection,
                date: normalizeDate(resigned),
                notes: `Imported from ${filename}`
            });
        }

        const currentSection = resigned && transitions.length > 1
            ? transitions[transitions.length - 2].section
            : transitions.length ? transitions[transitions.length - 1].section : null;

        const stage = resigned ? 'Retired' : transitions.length ? 'Invested' : 'Have a Go';

        youthData.push({
            name,
            member_number,
            dob,
            section: currentSection,
            membership_stage: stage
        });

        transitionData.push(...transitions);

        // Parents
        if (row.parent1_email || row.parent1_phone) {
            parentData.push({
                name: String(row.parent1_name || 'Unknown').trim(),
                email: row.parent1_email,
                contact_number: row.parent1_phone,
                linked_member_number: member_number,
                is_primary: true
            });
        }

        if (row.parent2_email || row.parent2_phone) {
            parentData.push({
                name: String(row.parent2_name || 'Unknown').trim(),
                email: row.parent2_email,
                contact_number: row.parent2_phone,
                linked_member_number: member_number,
                is_primary: false
            });
        }
    }

    return { youthData, transitionData, parentData };
}

function normalizeDate(val) {
    if (!val) return null;

    // If already a JS Date object
    if (val instanceof Date) return val;

    // If a string, try parsing
    if (typeof val === 'string') {
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // If Excel serial (number), convert
    if (typeof val === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + val * 86400000);
    }

    return null;
}
function cleanPhone(number) {
    return String(number || '').replace(/\s+/g, '').trim();
}