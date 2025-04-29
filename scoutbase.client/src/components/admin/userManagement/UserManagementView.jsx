// src/components/admin/UserManagementView.jsx

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, User } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { canEditUser, canDeleteUser, getAssignableRoles } from '@/utils/roleUtils';
import { logAuditEvent } from '@/helpers/auditHelper';
import { sections as lookupSections } from '@/components/common/Lookups.js';

// build section options plus a blank for "Group"
const sectionOptions = lookupSections
    .slice()
    .sort((a, b) => a.order - b.order);

const codeToSectionLabel = code =>
    lookupSections.find(s => s.code === code)?.label || code;

export default function UserManagementView({ activeGroupId, userInfo }) {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Group Leader',
        terrain_user_id: '',
        section: ''
    });
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchUsers = useCallback(async () => {
        const { data } = await supabase
            .from('users')
            .select('id, name, email, role, terrain_user_id, section')
            .eq('group_id', activeGroupId)
            .order('name');
        setUsers(data || []);
    }, [activeGroupId]);

    useEffect(() => {
        if (activeGroupId) fetchUsers();
    }, [activeGroupId, fetchUsers]);

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            role: 'Group Leader',
            terrain_user_id: '',
            section: ''
        });
        setEditingUserId(null);
    };

    const addUser = async () => {
        const cleaned = {
            ...formData,
            group_id: activeGroupId,
            section: ['Section Leader', 'Section User'].includes(formData.role) ? formData.section : null
        };
        if (!cleaned.name || !cleaned.email || !cleaned.terrain_user_id) {
            alert('Name, email, and Terrain User ID are required.');
            return;
        }
        if (['Section Leader', 'Section User'].includes(cleaned.role) && !cleaned.section) {
            alert('Section is required for this role.');
            return;
        }
        const { data, error } = await supabase
            .from('users')
            .insert([cleaned])                                    // 1) no second arg here
            .select('id, name, email, role, terrain_user_id, section, group_id')  // 2) explicitly list the fields
            .single();
            
        if (error) {
             console.error('Insert failed', error);
            alert('Failed to create user.');
            return;
        }
        await logAuditEvent({
            userId: userInfo.id,
            groupId: userInfo.group_id,
            role: userInfo.role,
            action: 'Add',
            targetType: 'User',
            targetId: data.id,
            metadata: `Created user ${data.name} with role ${data.role}${data.section ? ` in section ${data.section}` : ''}`
        });
        resetForm();
        fetchUsers();
    };

    const updateUser = async id => {
        const cleaned = {
            ...formData,
            section: ['Section Leader', 'Section User'].includes(formData.role) ? formData.section : null
        };
        const { error } = await supabase.from('users').update(cleaned).eq('id', id);
        if (error) {
            alert('Failed to update user.');
            return;
        }
        await logAuditEvent({
            userId: userInfo.id,
            groupId: userInfo.group_id,
            role: userInfo.role,
            action: 'Edit',
            targetType: 'User',
            targetId: id,
            metadata: `Updated user ${formData.name} — new role: ${formData.role}${formData.section ? `, section: ${formData.section}` : ''}`
        });
        resetForm();
        fetchUsers();
    };

    const deleteUser = async id => {
        if (!confirm('Delete this user?')) return;
        const { data: delUser, error: fetchErr } = await supabase.from('users').select('name, role, section').eq('id', id).single();
        if (fetchErr) {
            alert('User not found.');
            return;
        }
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) {
            alert('Failed to delete.');
            return;
        }
        await logAuditEvent({
            userId: userInfo.id,
            groupId: userInfo.group_id,
            role: userInfo.role,
            action: 'Delete',
            targetType: 'User',
            targetId: id,
            metadata: `Deleted user ${delUser.name} (${delUser.role}${delUser.section ? ` — ${delUser.section}` : ''})`
        });
        fetchUsers();
    };

    return (
        <div className="content-box">
            <PageTitle>
                <User size={25} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Manage Users
            </PageTitle>
            <AdminTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Section</th>
                        <th>Terrain User ID</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                                ) : u.name}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                                ) : u.email}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <select value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                                        {getAssignableRoles(userInfo).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                ) : u.role}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    ['Section Leader', 'Section User'].includes(formData.role) ? (
                                        <select value={formData.section} onChange={e => setFormData(f => ({ ...f, section: e.target.value }))}>
                                            <option value="">Group</option>
                                            {sectionOptions.map(s => (
                                                <option key={s.code} value={s.code}>{s.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: '#888' }}>—</span>
                                    )
                                ) : (
                                    u.section ? codeToSectionLabel(u.section) : 'Group'
                                )}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.terrain_user_id} onChange={e => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))} />
                                ) : u.terrain_user_id}
                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingUserId === u.id ? (
                                    <>
                                        <button onClick={() => updateUser(u.id)}><Check size={16} /></button>
                                        <button onClick={resetForm}><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        {canEditUser(userInfo, u) && <button onClick={() => { setEditingUserId(u.id); setFormData({ ...u }); }}><Pencil size={16} /></button>}
                                        {canDeleteUser(userInfo, u) && <button onClick={() => deleteUser(u.id)}><Trash size={16} /></button>}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}

                    {editingUserId === null && (
                        <tr>
                            <td><input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} /></td>
                            <td><input value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} /></td>
                            <td>
                                <select value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}>
                                    {getAssignableRoles(userInfo).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                {['Section Leader', 'Section User'].includes(formData.role) ? (
                                    <select value={formData.section} onChange={e => setFormData(f => ({ ...f, section: e.target.value }))}>
                                        <option value="">Group</option>
                                        {sectionOptions.map(s => (
                                            <option key={s.code} value={s.code}>{s.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span style={{ fontStyle: 'italic', color: '#888' }}>Group</span>
                                )}
                            </td>
                            <td><input value={formData.terrain_user_id} onChange={e => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))} /></td>
                            <td><button onClick={addUser}><Plus size={16} /></button></td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>
        </div>
    );
}