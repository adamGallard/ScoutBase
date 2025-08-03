import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Link, Key, Check, X,UserPlus,Hammer } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/helpers/auditHelper';
import { useLocation, useNavigate } from 'react-router-dom';
import EditParentSkillsModal from './EditParentSkillsModal';

export default function ParentView({ groupId, onOpenPinModal, onOpenLinkModal, userInfo }) {
    const [parents, setParents] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', comments: '', role: 'parent' });
    const [editingParentId, setEditingParentId] = useState(null);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12); // or however many you want per page
    const [addError, setAddError] = useState('');
    const defaultPIN = '1258';
    const query = new URLSearchParams(useLocation().search);
    const targetId = query.get('id'); // '5bd3990b...'
    const navigate = useNavigate();
    const location = useLocation();
    const [targetName, setTargetName] = useState(null);
    const [deletedMessage, setDeletedMessage] = useState('');
    const [selectedParent, setSelectedParent] = useState(null);
    const [showSkillsModal, setShowSkillsModal] = useState(false);

    const fetchParents = useCallback(async () => {
        const { data, error } = await supabase
            .from('parent')
            .select(`
            *,
            parent_youth (
                youth (
                    section,
                    linking_section
                )
            )
        `)
            .eq('group_id', groupId)
            .order('name');

        if (error) {
            console.error('Error fetching parents:', error);
            return;
        }

        let filtered = data;
        if (userInfo?.role === 'Section Leader' && userInfo?.section) {
            filtered = data.filter((parent) => {
                const links = parent.parent_youth || [];
                return (
                    links.length === 0 ||
                    links.some(
                        (py) =>
                            py.youth?.section === userInfo.section ||
                            py.youth?.linking_section === userInfo.section
                    )
                );
            });
        }

        // 👇 Filter to only the one if `targetId` exists
        let matchedParent = null;

        if (targetId) {
            filtered = filtered.filter(p => p.id === targetId);
            if (filtered.length === 1) {
                matchedParent = filtered[0];
            }
        }

        setParents(filtered);
        setTargetName(matchedParent?.name || null);
    }, [groupId, userInfo, targetId]);

    useEffect(() => {
        if (groupId) fetchParents();
    }, [groupId, fetchParents]);

    const addParent = async () => {
        const hashedPIN = await bcrypt.hash(defaultPIN, 10);
        const { name, email, phone, comments } = formData;
        if (!name || !email || !phone) {
            setAddError('Name, email and phone are required.');
            return;
        }


        // 1) Insert and get back the new row as `newParent`
        const { data: newParent, error: insertError } = await supabase
            .from('parent')              // correct table name
            .insert({
                name,
                email,
                phone,
				role: formData.role || 'parent', // default to 'parent' if not specified
                comments,
                group_id: groupId,
                pin_hash: hashedPIN
            })
            .select()                     // return all columns
            .single();                    // unwrap array to single object

        if (insertError) {
            console.error('Error adding parent:', insertError);
            if (insertError.code === '23505') {
                // Postgres unique violation
                setAddError('This Parent is already added.');
            } else {
                setAddError(insertError.message || 'Failed to add Parent.');
            }
            return;
        }

        // newParent is guaranteed to be an object now
        await logAuditEvent({
            userId: userInfo.id,
            groupId,
            role: userInfo.role,
            action: 'Add',
            targetType: 'Parent',
            targetId: newParent.id,
            metadata: `Added parent: ${newParent.name}`
        });
        setAddError('');
        setFormData({ name: '', email: '', phone: '', comments: '', role: 'parent' });
        fetchParents();
    };

    const updateParent = async (id) => {
        const { name, email, phone, role, comments } = formData;

        const { error } = await supabase
            .from('parent')
            .update({ name, email, phone, comments, role: role || 'parent' })
            .eq('id', id);

        if (error) {
            console.error('Update error:', error);
        } else {
            await logAuditEvent({
                userId: userInfo.id,
                groupId,
                role: userInfo.role,
                action: 'Edit',
                targetType: 'Parent',
                targetId: id,
                metadata: `Updated parent to: ${formData.name}`
            });
            fetchParents();
            setEditingParentId(null);
            setFormData({ name: '', email: '', phone: '' });
        }
    };

    const unlockParent = async (id) => {
        const { error } = await supabase
            .from('parent')
            .update({ is_locked: false, failed_pin_attempts: 0 })
            .eq('id', id);

        if (error) {
            alert("Failed to unlock parent: " + error.message);
            return;
        }
        await logAuditEvent({
            userId: userInfo.id,
            groupId,
            role: userInfo.role,
            action: 'Unlock',
            targetType: 'Parent',
            targetId: id,
            metadata: `Unlocked parent account`
        });
        fetchParents(); // Refresh list
    };

    const deleteParent = async (id) => {
        if (confirm('Are you sure you want to delete this parent?')) {
            const { data: deletedParent } = await supabase
                .from('parent')
                .select('name')
                .eq('id', id)
                .single();
            await supabase.from('parent').delete().eq('id', id);
            await logAuditEvent({
                userId: userInfo.id,
                groupId,
                role: userInfo.role,
                action: 'Delete',
                targetType: 'Parent',
                targetId: id,
                metadata: `Deleted parent: ${deletedParent?.name}`
            });
            // If we were filtered on this ID, clear the filter and reload all
            if (targetId === id) {
                navigate(location.pathname, { replace: true }); // remove ?id=
                setEditingParentId(null);
                setFormData({ name: '', email: '', phone: '', comments: '' });
                setTargetName(null);
            }

            // Fetch updated parent list
            
            setDeletedMessage(`Parent "${deletedParent?.name}" has been deleted.`);
            setTimeout(() => setDeletedMessage(''), 4000); // message disappears after 4s
            fetchParents();
        }
    };

    const sortedFiltered = [...parents]
        .filter(p =>
            (p.name?.toLowerCase() || '').includes(filter) ||
            (p.email?.toLowerCase() || '').includes(filter)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const paginatedParents = sortedFiltered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);


    const openSkillsModal = (parent) => {
        setSelectedParent(parent);
        setShowSkillsModal(true);
    };

    return (
        <div className="content-box">
            <PageTitle>
                <UserPlus size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Parent Management</PageTitle>

            <input
                type="text"
                placeholder="Search"
                value={filter}
                onChange={(e) => setFilter(e.target.value.toLowerCase())}
                style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            {deletedMessage && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                }}>
                    {deletedMessage}
                </div>
            )}
            {targetId && targetName && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    border: '1px solid #ffeeba',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>

                    <span>
                        Showing results filtered to <strong>{targetName}</strong> (parent)
                    </span>
                    <button
                        onClick={() => {
                            setFilter('');
                            setEditingParentId(null);
                            setFormData({ name: '', email: '', phone: '', comments: '' });
                            setTargetName(null);
                            navigate(location.pathname, { replace: true }); // remove ?id=
                            fetchParents(); // reload all
                        }}
                        style={{
                            backgroundColor: '#856404',
                            color: '#fff',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        Clear Filter
                    </button>
                </div>
            )}
            <AdminTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Comments</th>
                        <th style={{ width: '140px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedParents.map(p => (
                        <tr key={p.id} style={p.is_locked ? { backgroundColor: '#ffebee' } : {}}>
                            <td>
                                {editingParentId === p.id ? (
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                    />
                                ) : (
                                    p.name
                                )}
                            </td>
                            <td>
                                {editingParentId === p.id ? (
                                    <input
                                        value={formData.email}
                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                    />
                                ) : (
                                    p.email
                                )}
                            </td>
                            <td>
                                {editingParentId === p.id ? (
                                    <input
                                        value={formData.phone}
                                        onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                                    />
                                ) : (
                                    p.phone
                                )}
                            </td>
                            <td>
                                {editingParentId === p.id ? (
                                    <select
                                        value={formData.role || 'parent'}
                                        onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                                    >
                                        <option value="parent">Parent</option>
                                        <option value="leader">Leader</option>
                                        <option value="parent_helper">Parent Helper</option>
                                        <option value="committee">Committee</option>
                                    </select>
                                ) : (
                                    p.role === 'leader'
                                        ? "Leader"
                                        : p.role === 'parent_helper'
                                            ? "Parent Helper"
                                            : p.role === 'committee'
                                                ? "Committee"
                                                : "Parent"
                                )}
                            </td>
                            <td>
                                {editingParentId === p.id ? (
                                    <input
                                        value={formData.comments}
                                        onChange={(e) => setFormData(f => ({ ...f, comments: e.target.value }))}
                                    />
                                ) : (
                                    p.comments
                                )}

                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {p.is_locked && (
                                    <>
                                        <span style={{
                                            color: '#C00',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            <X size={16} color="#C00" /> Locked
                                        </span>
                                        <button
                                            style={{
                                                background: '#00664a',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 4,
                                                padding: '0.25rem 0.75rem',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => unlockParent(p.id)}
                                            title="Unlock parent"
                                        >
                                            Unlock
                                        </button>
                                    </>
                                )}
                                {!p.is_locked && editingParentId === p.id ? (
                                    <>
                                        <button onClick={() => updateParent(p.id)} title="Confirm"><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingParentId(null);
                                            setFormData({ name: '', email: '', phone: '' });
                                        }} title="Cancel">
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : !p.is_locked && (
                                    <>
                                        <button onClick={() => { setEditingParentId(p.id); setFormData(p); }} title="Edit parent"><Pencil size={16} /></button>
                                        <button onClick={() => onOpenLinkModal(p.id)} title="Link youth to parent"><Link size={16} /></button>
                                        <button onClick={() => openSkillsModal(p)} title="Skills & Interests"> <Hammer size={16} /></button>
                                        <button onClick={() => onOpenPinModal(p.id)} title="Reset pin"><Key size={16} /></button>
                                        <button onClick={() => deleteParent(p.id)} title="Delete parent"><Trash size={16} /></button>
                                    </>
                                )}
                            </td>

                        </tr>

                    )
                )}

                    {/* Add new parent row */}
                    {editingParentId === null && (
                        <tr>
                            <td>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    value={formData.email}
                                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    value={formData.phone}
                                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                                />
                            </td>
                            <td>
                                <select
                                    value={formData.role || 'parent'}
                                    onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                                >
                                    <option value="parent">Parent</option>
                                    <option value="leader">Leader</option>
                                    <option value="parent_helper">Parent Helper</option>
                                    <option value="committee">Committee</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    value={formData.comments}
                                    onChange={(e) => setFormData(f => ({ ...f, comments: e.target.value }))}
                                />
                            </td>
                            <td>
                                <button onClick={addParent} title="Add parent"><Plus size={16} /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>
            {addError && (
                <div style={{ color: 'red', marginBottom: '1rem' }}>
                    ⚠️ Could not add parent: {addError}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem' }}>
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {Math.ceil(sortedFiltered.length / itemsPerPage)}
                </span>
                <button
                    onClick={() =>
                        setCurrentPage((p) =>
                            Math.min(Math.ceil(sortedFiltered.length / itemsPerPage), p + 1)
                        )
                    }
                    disabled={currentPage === Math.ceil(sortedFiltered.length / itemsPerPage)}
                >
                    Next
                </button>
            </div>
            {showSkillsModal && selectedParent && (
                <EditParentSkillsModal
                    parent={selectedParent}
                    groupId={groupId}
                    onClose={() => setShowSkillsModal(false)}
                    onSave={(updatedParent) => {
                        // update parent list with updated data if needed
                        setShowSkillsModal(false);
                    }}
                />
            )}

        </div>
    );
}
