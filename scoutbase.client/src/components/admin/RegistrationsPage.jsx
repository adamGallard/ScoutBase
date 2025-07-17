// src/pages/admin/RegistrationsPage.jsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle } from '@/components/common/SharedStyles';
import { Check, X, ClipboardCheck, Edit2, Save } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/helpers/auditHelper';
// Inside your approval logic:

const defaultPIN = '1258';

function InlineEditField({ value, name, onChange, type = "text", style }) {
    return (
        <input
            type={type}
            value={value ?? ""}
            name={name}
            onChange={onChange}
            style={{
                ...style,
                fontSize: 14,
                padding: '2px 6px',
                border: '1px solid #ccc',
                borderRadius: 4,
                width: style?.width || 100,
            }}
        />
    );
}

function PendingTableRow({ person, type, approved, editing, setEditing, onSaveEdit, onApprove, onReject }) {
    const [editData, setEditData] = useState(person);

    useEffect(() => { setEditData(person); }, [person]);

    function handleChange(e) {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    }
    async function handleSave() {
        const table = type === 'parent' ? 'pending_parent' : 'pending_youth';
        await supabase.from(table).update(editData).eq('id', person.id);
        setEditing(null);
        onSaveEdit(editData);
    }
    return (
        <tr style={approved ? { background: '#e7fae8' } : {}}>
            {editing === person.id ? (
                <>
                    <td><InlineEditField value={editData.name} name="name" onChange={handleChange} /></td>
                    {type === 'parent' ? (
                        <>
                            <td><InlineEditField value={editData.email} name="email" onChange={handleChange} type="email" /></td>
                            <td><InlineEditField value={editData.phone} name="phone" onChange={handleChange} /></td>
                            <td><InlineEditField value={editData.skills} name="skills" onChange={handleChange} style={{ width: 90 }} /></td>
                            <td><InlineEditField value={editData.interests} name="interests" onChange={handleChange} style={{ width: 90 }} /></td>
                        </>
                    ) : (
                        <>
                            <td><InlineEditField value={editData.dob} name="dob" onChange={handleChange} type="date" style={{ width: 115 }} /></td>
                            <td><InlineEditField value={editData.section} name="section" onChange={handleChange} style={{ width: 75 }} /></td>
                        </>
                    )}
                    <td>
                        <button onClick={handleSave} style={{ color: '#16a34a', background: 'none', border: 'none' }}><Save size={16} /></button>
                        <button onClick={() => setEditing(null)} style={{ color: '#b91c1c', background: 'none', border: 'none', marginLeft: 6 }}>Cancel</button>
                    </td>
                </>
            ) : (
                <>
                    <td>{person.name}</td>
                    {type === 'parent' ? (
                        <>
                            <td>{person.email}</td>
                            <td>{person.phone}</td>
                            <td>{person.skills}</td>
                            <td>{person.interests}</td>
                        </>
                    ) : (
                        <>
                            <td>{person.dob}</td>
                            <td>{person.section}</td>
                        </>
                    )}
                    <td>
                        <button onClick={() => setEditing(person.id)} style={{ color: '#0F5BA4', background: 'none', border: 'none', marginRight: 4 }}>
                            <Edit2 size={16} />
                        </button>
                        <button onClick={onApprove} style={{ color: approved ? '#16a34a' : '#aaa', background: 'none', border: 'none', marginRight: 4 }}>
                            <Check size={16} />
                        </button>
                        <button onClick={onReject} style={{ color: '#dc2626', background: 'none', border: 'none' }}>
                            <X size={16} />
                        </button>
                    </td>
                </>
            )}
        </tr>
    );
}

export default function RegistrationsPage({ groupId, userInfo }) {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPending() {
            setLoading(true);
            const { data } = await supabase
                .from('pending_family')
                .select(`
           *,  
          pending_parent(*),
          pending_youth(*),
          pending_parent_youth(*)
        `)
                .eq('group_id', groupId)
                .eq('status', 'pending');
            if (data) {
                setPending(data.map(fam => ({
                    ...fam,
                    parentApprove: fam.pending_parent.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
                    youthApprove: fam.pending_youth.reduce((acc, y) => ({ ...acc, [y.id]: false }), {}),
                    parentReject: {},
                    youthReject: {},
                })));
            }
            setLoading(false);
        }
        fetchPending();
    }, [groupId]);

    const setFamilyState = (familyId, updater) => {
        setPending(list =>
            list.map(fam =>
                fam.id === familyId ? updater(fam) : fam
            )
        );
    };

    const toggleApprove = (familyId, type, id) => {
        setFamilyState(familyId, fam => ({
            ...fam,
            [`${type}Approve`]: { ...fam[`${type}Approve`], [id]: !fam[`${type}Approve`][id] },
            [`${type}Reject`]: { ...fam[`${type}Reject`], [id]: false },
        }));
    };

    const rejectItem = (familyId, type, id) => {
        setFamilyState(familyId, fam => ({
            ...fam,
            [`${type}Approve`]: { ...fam[`${type}Approve`], [id]: false },
            [`${type}Reject`]: { ...fam[`${type}Reject`], [id]: true },
        }));
    };

    const saveEdit = (familyId, type, updatedPerson) => {
        setFamilyState(familyId, fam => ({
            ...fam,
            [type === 'parent' ? 'pending_parent' : 'pending_youth']:
                fam[type === 'parent' ? 'pending_parent' : 'pending_youth'].map(
                    p => p.id === updatedPerson.id ? updatedPerson : p
                )
        }));
    };

    const handleApproveFamily = async fam => {
        try {
            const approvedParents = fam.pending_parent.filter(p => fam.parentApprove[p.id] && !fam.parentReject[p.id]);
            const approvedYouths = fam.pending_youth.filter(y => fam.youthApprove[y.id] && !fam.youthReject[y.id]);
            if (!approvedParents.length || !approvedYouths.length) {
                alert('At least one parent and one youth must be approved.');
                return;
            }
            const hashedPIN = await bcrypt.hash(defaultPIN, 10);

            const { data: realParents, error: parentErr } = await supabase
                .from('parent')
                .insert(approvedParents.map(p => ({
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    skills: p.skills,
                    interests_hobbies: p.interests,
                    group_id: fam.group_id,
                    pin_hash: hashedPIN
                })))
                .select();

            if (parentErr) throw new Error(parentErr.message);

            // 2. Insert youth
            const { data: realYouths, error: youthErr } = await supabase
                .from('youth')
                .insert(approvedYouths.map(y => ({
                    name: y.name,
                    dob: y.dob,
                    gender: y.gender,
                    section: y.section,
                    group_id: fam.group_id
                })))
                .select();

            if (youthErr) throw new Error(youthErr.message);

            // 3. Build a lookup: pending ID → new real ID
            const parentMap = {};
            approvedParents.forEach((p, i) => { parentMap[p.id] = realParents[i].id; });
            const youthMap = {};
            approvedYouths.forEach((y, i) => { youthMap[y.id] = realYouths[i].id; });

            const relRows = fam.pending_parent_youth
                .filter(link =>
                    parentMap[link.parent_id] && youthMap[link.youth_id]
                )
                .map(link => ({
                parent_id: parentMap[link.parent_id],
                youth_id: youthMap[link.youth_id],
                group_id: fam.group_id,
                is_primary: link.is_primary,
                relationship: link.relationship
            }));

            if (relRows.length) {
                const { error: linkErr } = await supabase.from('parent_youth').insert(relRows);
                if (linkErr) throw new Error(linkErr.message);
            }

            const transitions = realYouths.map(y => ({
                youth_id: y.id,
                transition_date: new Date().toISOString().split('T')[0],
                transition_type: 'have_a_go',
                section: y.section
            }));

            const { error: transitionErr } = await supabase
                .from('youth_transitions')
                .insert(transitions);

            if (transitionErr) {
                // handle/log error
            }

            // Delete all pending records for this family
            await supabase.from('pending_parent_youth').delete().eq('family_id', fam.id);
            await supabase.from('pending_parent').delete().eq('family_id', fam.id);
            await supabase.from('pending_youth').delete().eq('family_id', fam.id);
            await supabase.from('pending_family').delete().eq('id', fam.id);

            // 6. Log the audit event
            await logAuditEvent({
                userId: userInfo.id,
                groupId: fam.group_id,
                role: userInfo.role,
                action: 'approve_family_registration',
                targetType: 'Family',
                targetId: fam.id,
                metadata: `Approved family. Parents: ${approvedParents.map(p => p.email).join(', ')}`
            });

            // UI: Remove from list and show a message
            setPending(pending => pending.filter(f => f.id !== fam.id));
            alert('Family imported!');
        } catch (err) {
            alert('Error approving registration: ' + err.message);
        }
    };


    const handleReject = async familyId => {
        // 1. Delete all pending_ for this familyId
        await supabase.from('pending_parent_youth').delete().eq('family_id', familyId);
        await supabase.from('pending_parent').delete().eq('family_id', familyId);
        await supabase.from('pending_youth').delete().eq('family_id', familyId);
        await supabase.from('pending_family').delete().eq('id', familyId);
        setPending(pending => pending.filter(fam => fam.id !== familyId));
    };

    return (
        <div style={{ padding: 24 }}>
            <PageTitle>
                <ClipboardCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Pending Registrations
            </PageTitle>
            {loading ? (
                <p>Loading…</p>
            ) : pending.length === 0 ? (
                <p>No pending family registrations.</p>
            ) : (
                pending.map(fam => (
                    <div key={fam.id} style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        margin: '18px 0',
                        padding: 16
                    }}>
                        <b>Family ID: {fam.id.slice(0, 8)}...</b>

                        {/* PARENTS TABLE */}
                        <div style={{ margin: '10px 0 0 0' }}>
                            <b>Parents:</b>
                            <table style={{ width: '100%', margin: '8px 0', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Skills</th>
                                        <th>Hobbies</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                            {fam.pending_parent.map(parent => (
                                        <PendingTableRow
                                            key={parent.id}
                                            person={parent}
                                            type="parent"
                                            approved={fam.parentApprove[parent.id]}
                                            editing={fam.editingParent}
                                            setEditing={editingId => setFamilyState(fam.id, fam0 => ({ ...fam0, editingParent: editingId }))}
                                            onApprove={() => toggleApprove(fam.id, 'parent', parent.id)}
                                            onReject={() => rejectItem(fam.id, 'parent', parent.id)}
                                            onSaveEdit={p => saveEdit(fam.id, 'parent', p)}
                                        />
                            ))}
                                </tbody>
                            </table>
                        </div>

                        {/* YOUTHS TABLE */}
                        <div style={{ margin: '10px 0 0 0' }}>
                            <b>Youths:</b>
                            <table style={{ width: '100%', margin: '8px 0', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                        <th>Name</th>
                                        <th>DOB</th>
                                        <th>Section</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                            {fam.pending_youth.map(youth => (
                                        <PendingTableRow
                                            key={youth.id}
                                            person={youth}
                                            type="youth"
                                            approved={fam.youthApprove[youth.id]}
                                            editing={fam.editingYouth}
                                            setEditing={editingId => setFamilyState(fam.id, fam0 => ({ ...fam0, editingYouth: editingId }))}
                                            onApprove={() => toggleApprove(fam.id, 'youth', youth.id)}
                                            onReject={() => rejectItem(fam.id, 'youth', youth.id)}
                                            onSaveEdit={y => saveEdit(fam.id, 'youth', y)}
                                        />
                            ))}
                                </tbody>
                            </table>
                        </div>

                        {/* RELATIONSHIPS */}
                        <div>
                            <b>Relationships:</b>
                            {fam.pending_parent_youth.map(link => (
                                <div key={link.id} style={{ fontSize: 13, paddingLeft: 8 }}>
                                    Parent: {fam.pending_parent.find(p => p.id === link.parent_id)?.name || link.parent_id}
                                    {' '}→ Youth: {fam.pending_youth.find(y => y.id === link.youth_id)?.name || link.youth_id}
                                    {' '}({link.relationship}{link.is_primary ? ', primary' : ''})
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <button
                                style={{ color: 'white', background: '#16a34a', marginRight: 12, border: 'none', borderRadius: 5, padding: '6px 15px' }}
                                onClick={() => handleApproveFamily(fam)}
                            >
                                <Check size={16} style={{ verticalAlign: 'middle' }} /> Approve Family
                            </button>
                            <button
                                style={{ color: 'white', background: '#dc2626', border: 'none', borderRadius: 5, padding: '6px 15px' }}
                                onClick={async () => {
                                    await supabase.from('pending_parent_youth').delete().eq('family_id', fam.id);
                                    await supabase.from('pending_parent').delete().eq('family_id', fam.id);
                                    await supabase.from('pending_youth').delete().eq('family_id', fam.id);
                                    await supabase.from('pending_family').delete().eq('id', fam.id);
                                    setPending(pending => pending.filter(f => f.id !== fam.id));
                                }}
                            >
                                <X size={16} style={{ verticalAlign: 'middle' }} /> Reject Family
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
