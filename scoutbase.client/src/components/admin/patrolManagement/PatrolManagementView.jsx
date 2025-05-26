// src/components/admin/PatrolManagementView.jsx
import React,{ useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Flag, Link as LinkIcon, Download } from 'lucide-react';
import {
    PageWrapper,
    Content,
    PageTitle,
    PrimaryButton,
    AdminTable,
    CompactInput,
    CompactInputGroup,
    CompactSelect,
} from '@/components/common/SharedStyles';
import PatrolLinkModal from './PatrolLinkModal';

import { sections, sectionMap,stages } from '@/components/common/Lookups';

export default function PatrolManagementView({ groupId, userInfo }) {
    const isSectionLeader = userInfo?.role === 'Section Leader';

    // default to the user’s section (if Section Leader) or first lookup section
    const defaultSection = isSectionLeader
        ? userInfo.section
        : sections[0]?.code || '';
    const [section, setSection] = useState(defaultSection);

    const [patrols, setPatrols] = useState([]);
    const [newPatrolName, setNewPatrolName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [linkingPatrol, setLinkingPatrol] = useState(null);
    const [addError, setAddError] = useState('');
    // find the code for the "Retired" stage so we can filter it out
    const retiredStageCode = stages.find(s => s.label === 'Retired')?.code;
    const [openPatrols, setOpenPatrols] = useState({}); // { patrolId: true }
    const [membersById, setMembersById] = useState({}); // { patrolId: [youth…] }


    async function loadMembers(patrolId) {
        // already cached?
        if (membersById[patrolId]) return;

        const { data, error } = await supabase
            .from('youth')
            .select('id, name, rank, membership_stage')
            .eq('patrol_id', patrolId)
            .eq('group_id', groupId)
            .neq('membership_stage', 'retired');          // hide retired

        if (error) {
            console.error('members fetch', error);
            return;
        }

        /* ---------- sort: PL → APL → everyone else (A-Z) ---------- */
        const priority = { PL: 0, APL: 1 };          // lower = earlier
        data.sort((a, b) => {
            const aPri = priority[a.rank] ?? 2;
            const bPri = priority[b.rank] ?? 2;
            if (aPri !== bPri) return aPri - bPri;      // PL before APL before rest
            return a.name.localeCompare(b.name);        // tie-break by name
        });

        setMembersById(m => ({ ...m, [patrolId]: data }));
    }

    function togglePatrol(patrolId) {
        setOpenPatrols(o => {
            const next = { ...o, [patrolId]: !o[patrolId] };
            // if we just opened it, lazily load members
            if (next[patrolId]) loadMembers(patrolId);
            return next;
        });
    }

    const fetchPatrols = async () => {
        const { data, error } = await supabase
            .from('patrols')
            .select('*')
            .eq('group_id', groupId)
            .eq('section', section)
            .order('name');

        if (error) {
            console.error('Error fetching patrols:', error);
            return;
        }

        const patrolsWithCounts = await Promise.all(
            data.map(async (p) => {
                const { count, error: cntErr } = await supabase
                    .from('youth')
                    .select('id', { count: 'exact', head: true })
                    .eq('patrol_id', p.id)
                    .eq('group_id', groupId)
                    .neq('membership_stage', retiredStageCode);
                if (cntErr) {
                    console.error(`Error fetching count for patrol ${p.id}:`, cntErr);
                    return { ...p, youth_count: 0 };
                }
                return { ...p, youth_count: count };
            })
        );

        setPatrols(patrolsWithCounts);
    };

    useEffect(() => {
        if (groupId && section) fetchPatrols();
    }, [groupId, section]);

    const addPatrol = async () => {
        if (!newPatrolName.trim()) {
            setAddError('Patrol name is required.');
            return;
        }

        const { error: insertError } = await supabase.from('patrols').insert({
            name: newPatrolName.trim(),
            group_id: groupId,
            section,
        });

        if (insertError?.code === '23505') {
            setAddError('A patrol with this name already exists in this section.');
            return;
        } else if (insertError) {
            setAddError(insertError.message || 'Unexpected error adding patrol.');
            return;
        }

        setNewPatrolName('');
        setAddError('');
        fetchPatrols();
    };

    const updatePatrol = async (id) => {
        await supabase.from('patrols').update({ name: editName }).eq('id', id);
        setEditingId(null);
        setEditName('');
        fetchPatrols();
    };

    const deletePatrol = async (id) => {
        if (confirm('Are you sure you want to delete this patrol?')) {
            await supabase.from('patrols').delete().eq('id', id);
            fetchPatrols();
        }
    };

    const exportCSV = async () => {
        // fetch non-retired youth only
        const { data: youthData, error: youthErr } = await supabase
            .from('youth')
            .select('id, name, rank, patrol_id')
            .eq('group_id', groupId)
            .neq('membership_stage', retiredStageCode);
        if (youthErr) {
            console.error('Error fetching youth for CSV:', youthErr);
            return;
        }

        let csv = 'Patrol,Section,Youth Name,Rank\n';
        patrols.forEach((p) => {
            const members = youthData.filter((y) => y.patrol_id === p.id);
            if (members.length) {
                members.forEach((m) => {
                    csv += `"${p.name}","${p.section}","${m.name}","${m.rank || ''}"\n`;
                });
            } else {
                csv += `"${p.name}","${p.section}","",""\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patrols_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="content-box">
            <PageTitle>
                <Flag size={24} style={{ marginRight: '0.5rem' }} />
                Patrol Management
            </PageTitle>

            <CompactInputGroup>
                {!isSectionLeader && (
                    <CompactSelect value={section} onChange={e => setSection(e.target.value)}>
                        {sections.map(s => (
                            <option key={s.code} value={s.code}>
                                {s.label}
                            </option>
                        ))}
                    </CompactSelect>
                )}
                <CompactInput
                    placeholder="New Patrol Name"
                    value={newPatrolName}
                    onChange={e => setNewPatrolName(e.target.value)}
                />
                <PrimaryButton onClick={addPatrol}>
                    <Plus size={16} /> Add Patrol
                </PrimaryButton>
                <PrimaryButton onClick={exportCSV} style={{ marginLeft: '1rem' }}>
                    <Download size={16} /> Export CSV
                </PrimaryButton>
            </CompactInputGroup>

            {addError && (
                <div style={{ color: 'red', marginTop: '0.5rem' }}>
                    ⚠️ Could not add patrol: {addError}
                </div>
            )}

            <AdminTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Members</th>
                        <th>Section</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {patrols.map(p => (
                        /* one fragment per patrol ------------------------------------- */
                        <React.Fragment key={p.id}>
                            {/* ── parent row ───────────────────────────────────────────── */}
                            <tr>
                                <td
                                    onClick={() => togglePatrol(p.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {openPatrols[p.id] ? '▼ ' : '▶ '}
                                    {p.name}
                                </td>
                                <td>{p.youth_count ?? 0}</td>
                                <td>{sectionMap[p.section]?.label || p.section}</td>
                                <td style={{ display: 'flex', gap: '.5rem' }}>
                                    {editingId === p.id ? (
                                        <>
                                            <button onClick={() => updatePatrol(p.id)}>Save</button>
                                            <button onClick={() => setEditingId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setLinkingPatrol(p)}
                                                title="Link youth to patrol"
                                            >
                                                <LinkIcon size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(p.id);
                                                    setEditName(p.name);
                                                }}
                                                title="Edit name"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deletePatrol(p.id)} title="Delete">
                                                <Trash size={16} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>

                            {/* ── expandable members row (only if open) ────────────────── */}
                            {openPatrols[p.id] && (
                                <tr key={`${p.id}-members`}>
                                    <td colSpan={4} style={{ paddingLeft: '2rem', background: '#fafafa' }}>
                                        {membersById[p.id]
                                            ? (
                                                membersById[p.id].length
                                                    ? (
                                                        <ul style={{ margin: 0 }}>
                                                            {membersById[p.id].map(m => (
                                                                <li key={m.id}>
                                                                    {m.name}{m.rank ? ` – ${m.rank}` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )
                                                    : <i>No members in this patrol.</i>
                                            )
                                            : <i>Loading…</i>
                                        }
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}

                </tbody>
            </AdminTable>

            {linkingPatrol && (
                <PatrolLinkModal
                    patrolId={linkingPatrol.id}
                    groupId={groupId}
                    patrolName={linkingPatrol.name}
                    section={linkingPatrol.section}
                    onClose={() => setLinkingPatrol(null)}
                />
            )}
        </div>
    );
}
