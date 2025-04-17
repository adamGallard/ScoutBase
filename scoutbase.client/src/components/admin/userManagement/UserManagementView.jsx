import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, User } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { canEditUser, canDeleteUser, getAssignableRoles } from '@/utils/roleUtils';
const sections = ['Joeys', 'Cubs', 'Scouts', 'Venturers', 'Rovers'];
import { logAuditEvent } from '@/helpers/auditHelper';
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

    const addUser = async () => {
        const cleanedData = {
            ...formData,
            group_id: activeGroupId,
            section:
                formData.role === 'Section Leader' || formData.role === 'Section User'
                    ? formData.section
                    : null,
        };

        if (!cleanedData.name || !cleanedData.email || !cleanedData.terrain_user_id) {
            alert('Name, email, and Terrain User ID are required.');
            return;
        }

        if (
            (cleanedData.role === 'Section Leader' || cleanedData.role === 'Section User') &&
            !cleanedData.section
        ) {
            alert('Section is required for this role.');
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .insert([cleanedData])
            .select()
            .single();

        if (error) {
            console.error('❌ Insert failed:', error.message);
            alert('Failed to create user. Please check inputs.');
            return;
        }

        // ✅ Audit logging
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

    const updateUser = async (id) => {
        const cleanedData = {
            ...formData,
            section:
                formData.role === 'Section Leader' || formData.role === 'Section User'
                    ? formData.section
                    : null,
        };

        const { error } = await supabase
            .from('users')
            .update(cleanedData)
            .eq('id', id);

        if (error) {
            console.error('❌ Update failed:', error.message);
            alert('Failed to update user.');
            return;
        }

        // ✅ Audit log for edit
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

    const deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        // 🧠 Fetch user details first for audit log
        const { data: deletedUser, error: fetchError } = await supabase
            .from('users')
            .select('name, role, section')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('❌ Could not fetch user to delete:', fetchError.message);
            alert('Failed to delete user — could not find user.');
            return;
        }

        const { error } = await supabase.from('users').delete().eq('id', id);

        if (error) {
            console.error('❌ Delete failed:', error.message);
            alert('Failed to delete user.');
            return;
        }

        // ✅ Audit log for delete
        await logAuditEvent({
            userId: userInfo.id,
            groupId: userInfo.group_id,
            role: userInfo.role,
            action: 'Delete',
            targetType: 'User',
            targetId: id,
            metadata: `Deleted user ${deletedUser.name} (${deletedUser.role}${deletedUser.section ? ` — ${deletedUser.section}` : ''})`
        });

        fetchUsers();
    };

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

    return (
        <div className="content-box">
            <PageTitle>
                <User size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Manage Users
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
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
                                ) : u.name}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} />
                                ) : u.email}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <select value={formData.role} onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}>
                                        {getAssignableRoles(userInfo).map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                ) : u.role}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    (formData.role === 'Section Leader' || formData.role === 'Section User') ? (
                                        <select
                                            value={formData.section}
                                            onChange={(e) => setFormData(f => ({ ...f, section: e.target.value }))}
                                        >
                                            {sections.map((s) => (
                                                <option key={s} value={s}>{s || 'Group'}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span style={{ fontStyle: 'italic', color: '#888' }}>—</span>
                                    )
                                ) : (
                                        u.section || 'Group'
                                )}
                            </td>

                            <td>
                                {editingUserId === u.id ? (
                                    <input value={formData.terrain_user_id} onChange={(e) => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))} />
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
                                            <>
                                                {canEditUser(userInfo, u) && (
                                                    <button onClick={() => { setEditingUserId(u.id); setFormData(u); }}><Pencil size={16} /></button>
                                                )}
                                                {canDeleteUser(userInfo, u) && (
                                                    <button onClick={() => deleteUser(u.id)}><Trash size={16} /></button>
                                                )}
                                            </>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}

                    {editingUserId === null && (
                        <tr>
                            <td>
                                <input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
                            </td>
                            <td>
                                <input value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} />
                            </td>
                            <td>
                                <select value={formData.role} onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}>
                                    {getAssignableRoles(userInfo).map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                {(formData.role === 'Section Leader' || formData.role === 'Section User') ? (
                                    <select
                                        value={formData.section}
                                        onChange={(e) => setFormData(f => ({ ...f, section: e.target.value }))}
                                    >
                                        {sections.map((s) => (
                                            <option key={s} value={s}>{s || 'Group'}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span style={{ fontStyle: 'italic', color: '#888' }}>Group</span>
                                )}
                            </td>

                            <td>
                                <input value={formData.terrain_user_id} onChange={(e) => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))} />
                            </td>
                            <td>
                                <button onClick={addUser}><Plus size={16} /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>
        </div>
    );
}
