// src/components/admin/PatrolManagementView.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Flag ,Link} from 'lucide-react';
import {
    PageWrapper,
    Content,
    PageTitle,
    PrimaryButton,
    AdminTable
} from '@/components/SharedStyles';
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

        if (!error) setPatrols(data || []);
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

    return (
        <PageWrapper>
            <Content>
                <PageTitle>
                    <Flag size={24} style={{ marginRight: '0.5rem' }} />
                    Patrol Management
                </PageTitle>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {!isSectionLeader && (
                        <label>
                            Section:
                            <select
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                style={{ marginLeft: '0.5rem', padding: '0.4rem' }}
                            >
                                <option value="Joeys">Joeys</option>
                                <option value="Cubs">Cubs</option>
                                <option value="Scouts">Scouts</option>
                                <option value="Venturers">Venturers</option>
                            </select>
                        </label>
                    )}

                    <input
                        placeholder="New Patrol Name"
                        value={newPatrolName}
                        onChange={(e) => setNewPatrolName(e.target.value)}
                        style={{ padding: '0.4rem', flexGrow: 1 }}
                    />
                    <PrimaryButton onClick={addPatrol}>
                        <Plus size={16} /> Add Patrol
                    </PrimaryButton>
                </div>

                <AdminTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Section</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patrols.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    {editingId === p.id ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            style={{ padding: '0.3rem' }}
                                        />
                                    ) : (
                                        p.name
                                    )}
                                </td>
                                <td>{p.section}</td>
                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                    {editingId === p.id ? (
                                        <>
                                            <button onClick={() => updatePatrol(p.id)}>Save</button>
                                            <button onClick={() => setEditingId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setLinkingPatrol(p)} title="Link youth to patrol">
                                                <Link size={16} />
                                            </button>
                                            <button onClick={() => {
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
            </Content>
        </PageWrapper>
    );
}

