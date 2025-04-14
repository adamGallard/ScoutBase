import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, User } from 'lucide-react';
import { AdminTable ,PageTitle} from '../SharedStyles';

export default function UserManagementView({ activeGroupId }) {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'admin', terrain_user_id: '' });
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchUsers = useCallback(async () => {
        const { data } = await supabase
            .from('users')
            .select('id, name, email, role, terrain_user_id')
            .eq('group_id', activeGroupId)
            .order('name');
        setUsers(data || []);
    }, [activeGroupId]);

    useEffect(() => {
        if (activeGroupId) fetchUsers();
    }, [activeGroupId, fetchUsers]);

    const addUser = async () => {
        if (!formData.name || !formData.email || !formData.terrain_user_id) return;
        await supabase.from('users').insert([{ ...formData, group_id: activeGroupId }]);
        setFormData({ name: '', email: '', role: 'admin', terrain_user_id: '' });
        fetchUsers();
    };

    const updateUser = async (id) => {
        await supabase.from('users').update(formData).eq('id', id);
        setEditingUserId(null);
        setFormData({ name: '', email: '', role: 'admin', terrain_user_id: '' });
        fetchUsers();
    };

    const deleteUser = async (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await supabase.from('users').delete().eq('id', id);
            fetchUsers();
        }
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
                        <th>Terrain User ID</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>
                                {editingUserId === u.id ? (
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                    />
                                ) : u.name}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <input
                                        value={formData.email}
                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                    />
                                ) : u.email}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}
                                    >
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                        <option value="superadmin">superadmin</option>
                                    </select>
                                ) : u.role}
                            </td>
                            <td>
                                {editingUserId === u.id ? (
                                    <input
                                        value={formData.terrain_user_id}
                                        onChange={(e) => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))}
                                    />
                                ) : u.terrain_user_id}
                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingUserId === u.id ? (
                                    <>
                                        <button onClick={() => updateUser(u.id)}><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingUserId(null);
                                            setFormData({ name: '', email: '', role: 'admin', terrain_user_id: '' });
                                        }}><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingUserId(u.id); setFormData(u); }}><Pencil size={16} /></button>
                                        <button onClick={() => deleteUser(u.id)}><Trash size={16} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}

                    {editingUserId === null && (
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
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(f => ({ ...f, role: e.target.value }))}
                                >
                                    <option value="admin">admin</option>
                                    <option value="superadmin">superadmin</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    value={formData.terrain_user_id}
                                    onChange={(e) => setFormData(f => ({ ...f, terrain_user_id: e.target.value }))}
                                />
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
