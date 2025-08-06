import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Link, KeyRound, Check, X, UserPlus, Lightbulb } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import bcrypt from 'bcryptjs';
import { logAuditEvent } from '@/helpers/auditHelper';
import { useLocation, useNavigate } from 'react-router-dom';
import EditParentSkillsModal from './EditParentSkillsModal';

// Utility to title-case a string ("cubs" => "Cubs", "joeys" => "Joeys", etc)
function toTitleCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function ParentView({ groupId, onOpenPinModal, onOpenLinkModal, userInfo }) {
    const [parents, setParents] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', comments: '', role_code: '' });
    const [editingParentId, setEditingParentId] = useState(null);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [addError, setAddError] = useState('');
    const defaultPIN = '1258';
    const query = new URLSearchParams(useLocation().search);
    const targetId = query.get('id');
    const navigate = useNavigate();
    const location = useLocation();
    const [targetName, setTargetName] = useState(null);
    const [deletedMessage, setDeletedMessage] = useState('');
    const [selectedParent, setSelectedParent] = useState(null);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [roleList, setRoleList] = useState([]);
    const [roleGroupList, setRoleGroupList] = useState([]);
    const [sectionList, setSectionList] = useState([]);

    // Fetch adult roles table
    useEffect(() => {
        supabase
            .from('adult_roles')
            .select('*')
			.order('order')
            .then(({ data }) => {
                setRoleList(data || []);
                // Unique role groups
                const uniqueGroups = Array.from(new Set((data || []).map(r => r.role_group).filter(Boolean)));
                setRoleGroupList(uniqueGroups);
                // Unique sections
                const uniqueSections = Array.from(new Set((data || []).map(r => r.section).filter(Boolean)));
                setSectionList(uniqueSections);
            });
    }, []);

    // Fetch parent/adult records
    const fetchParents = useCallback(async () => {
        const { data, error } = await supabase
            .from('parent')
            .select(`
                *,
                adult_roles:role_code (
                    title,
                    role_group,
                    section,
                    abbreviation
                )
            `)
            .eq('group_id', groupId)
            .order('name');

        if (error) {
            console.error('Error fetching parents:', error);
            return;
        }

        // Section-based filtering (if you have it)
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

    // Add new parent/adult
    const addParent = async () => {
        const hashedPIN = await bcrypt.hash(defaultPIN, 10);
        const { name, email, phone, comments, role_code } = formData;
        if (!name || !email || !phone) {
            setAddError('Name, email and phone are required.');
            return;
        }

        const { data: newParent, error: insertError } = await supabase
            .from('parent')
            .insert({
                name,
                email,
                phone,
                role_code: role_code || null,
                comments,
                group_id: groupId,
                pin_hash: hashedPIN
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error adding parent:', insertError);
            if (insertError.code === '23505') {
                setAddError('This Parent is already added.');
            } else {
                setAddError(insertError.message || 'Failed to add Parent.');
            }
            return;
        }

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
        setFormData({ name: '', email: '', phone: '', comments: '', role_code: '' });
        fetchParents();
    };

    // Update parent/adult
    const updateParent = async (id) => {
        const { name, email, phone, role_code, comments } = formData;
        const { error } = await supabase
            .from('parent')
            .update({ name, email, phone, comments, role_code: role_code || null })
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
            setFormData({ name: '', email: '', phone: '', comments: '', role_code: '' });
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
            if (targetId === id) {
                navigate(location.pathname, { replace: true });
                setEditingParentId(null);
                setFormData({ name: '', email: '', phone: '', comments: '', role_code: '' });
                setTargetName(null);
            }
            setDeletedMessage(`Parent "${deletedParent?.name}" has been deleted.`);
            setTimeout(() => setDeletedMessage(''), 4000);
            fetchParents();
        }
    };

    // Filtering for search, role_group, and section
    const sortedFiltered = [...parents]
        .filter(p =>
            (!roleFilter || (p.adult_roles?.role_group === roleFilter)) &&
            (!sectionFilter || (p.adult_roles?.section && p.adult_roles.section.toLowerCase() === sectionFilter.toLowerCase())) &&
            (
                (p.name?.toLowerCase() || '').includes(filter) ||
                (p.email?.toLowerCase() || '').includes(filter)
            )
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const paginatedParents = sortedFiltered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, roleFilter, sectionFilter]);

    const openSkillsModal = (parent) => {
        setSelectedParent(parent);
        setShowSkillsModal(true);
    };

    return (
        <div className="content-box">
            <PageTitle>
                <UserPlus size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Adult Management
            </PageTitle>

            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <input
                    type="text"
                    placeholder="Search"
                    value={filter}
                    onChange={e => setFilter(e.target.value.toLowerCase())}
                    style={{
                        padding: '0.4rem 0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        width: 160,
                        fontSize: '1rem',
                    }}
                />
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                    <span style={{ marginRight: 4 }}>Role Group:</span>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            width: 160,
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">All</option>
                        {roleGroupList.map(group => (
                            <option key={group} value={group}>{toTitleCase(group)}</option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '1rem' }}>
                    <span style={{ marginRight: 4 }}>Section:</span>
                    <select
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value)}
                        style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                            width: 140,
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">All</option>
                        {sectionList.map(section => (
                            <option key={section} value={section}>
                                {toTitleCase(section)}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
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
                            setFormData({ name: '', email: '', phone: '', comments: '', role_code: '' });
                            setTargetName(null);
                            navigate(location.pathname, { replace: true });
                            fetchParents();
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
                        <th>Section</th>
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
                                        value={formData.role_code || ''}
                                        onChange={e => setFormData(f => ({ ...f, role_code: e.target.value }))}
                                    >
                                        <option value="">Select a role…</option>
                                        {roleList.map(role => (
                                            <option key={role.code} value={role.code}>
                                                {role.title}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    p.adult_roles?.title || <i>Unassigned</i>
                                )}
                            </td>
                            <td>
                                {p.adult_roles?.section ? toTitleCase(p.adult_roles.section) : <i>—</i>}
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
                                            setFormData({ name: '', email: '', phone: '', comments: '', role_code: '' });
                                        }} title="Cancel">
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : !p.is_locked && (
                                    <>

                                        <button onClick={() => {
                                            setEditingParentId(p.id); setFormData({
                                                name: p.name,
                                                email: p.email,
                                                phone: p.phone,
                                                comments: p.comments,
                                                role_code: p.role_code || ''
                                            });
                                        }} title="Edit parent"><Pencil size={16} /></button>
                                        <button onClick={() => onOpenLinkModal(p.id)} title="Link youth to parent"><Link size={16} /></button>
                                            <button onClick={() => openSkillsModal(p)} title="Skills & Interests"> <Lightbulb size={16} /></button>
                                            <button onClick={() => onOpenPinModal(p.id)} title="Reset pin"><KeyRound size={16} /></button>
                                            <button onClick={() => deleteParent(p.id)} title="Delete parent" style={{ color: '#C00' }}><Trash size={16} /></button>

                                    </>
                                )}
                            </td>

                        </tr>
                    ))}
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
                                    value={formData.role_code || ''}
                                    onChange={e => setFormData(f => ({ ...f, role_code: e.target.value }))}
                                    style={{
                                        width: '160px',
                                        fontSize: '0.97rem',
                                        padding: '2px 8px',        // Less vertical padding
                                        height: '28px',            // Explicitly set a shorter height
                                        lineHeight: '1.1',         // Adjusts content vertically
                                        borderRadius: 6,
                                        border: '1px solid #ccc',
                                        background: '#fff',
                                        maxWidth: '100%'
                                    }}
                                >
                                    <option value="">Select a role…</option>
                                    {roleList.map(role => (
                                        <option key={role.code} value={role.code}>
                                            {role.title}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                {/* Section auto-derived from selected role */}
                                {formData.role_code
                                    ? toTitleCase(roleList.find(r => r.code === formData.role_code)?.section)
                                    : <i>—</i>}
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
                        setShowSkillsModal(false);
                    }}
                />
            )}
        </div>
    );
}
