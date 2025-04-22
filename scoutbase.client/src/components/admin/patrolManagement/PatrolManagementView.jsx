// src/components/admin/PatrolManagementView.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Flag ,Link, Download} from 'lucide-react';
import {
    PageWrapper,
    Content,
    PageTitle,
    PrimaryButton,
    AdminTable, CompactInput, CompactInputGroup, CompactSelect, 
} from '@/components/common/SharedStyles';
import PatrolLinkModal from './PatrolLinkModal';

export default function PatrolManagementView({ groupId, userInfo }) {
    const [section, setSection] = useState(userInfo?.role === 'Section Leader' ? userInfo.section : 'Cubs');
    const [patrols, setPatrols] = useState([]);
    const [newPatrolName, setNewPatrolName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [linkingPatrol, setLinkingPatrol] = useState(null);

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
                    .eq('group_id', groupId);
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
        if (!newPatrolName.trim()) return;
        await supabase.from('patrols').insert({
            name: newPatrolName.trim(),
            group_id: groupId,
            section,
        });
        setNewPatrolName('');
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

    const isSectionLeader = userInfo?.role === 'Section Leader';

    const exportCSV = async () => {
        const { data: youthData, error: youthErr } = await supabase
            .from('youth')
            .select('id, name, rank, patrol_id')
            .eq('group_id', groupId);
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
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                <PageTitle>
                    <Flag size={24} style={{ marginRight: '0.5rem' }} />
                    Patrol Management
                </PageTitle>


                <CompactInputGroup>
                    <div>
                        {!isSectionLeader && (
                        
                            <CompactSelect 
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                            >
                                <option value="Joeys">Joeys</option>
                                <option value="Cubs">Cubs</option>
                                <option value="Scouts">Scouts</option>
                                <option value="Venturers">Venturers</option>
                            </CompactSelect>
                    )}
                        <CompactInput
                        placeholder="New Patrol Name"
                        value={newPatrolName}
                        onChange={(e) => setNewPatrolName(e.target.value)}
                       >
                        </CompactInput>


                    <PrimaryButton onClick={addPatrol}>
                        <Plus size={16} /> Add Patrol
                        </PrimaryButton>
                        <PrimaryButton onClick={exportCSV} style={{ marginBottom: '1rem' }}>
                            <Download size={16} /> Export CSV
                        </PrimaryButton>
                    </div>

             </CompactInputGroup> 

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
                        {patrols.map((p) => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.youth_count ?? 0}</td>
                                <td>{p.section}</td>
                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                    {editingId === p.id ? (
                                        <>
                                            <button onClick={() => updatePatrol(p.id)}>Save</button>
                                            <button onClick={() => setEditingId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setLinkingPatrol(p)}
                                                title="Link youth to patrol">
                                                <Link size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(p.id);
                                                    setEditName(p.name);
                                                }}>
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deletePatrol(p.id)}>
                                                <Trash size={16} />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
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
        </div>
    );
}

