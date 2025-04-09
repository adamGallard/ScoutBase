import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X } from 'lucide-react';
import { AdminTable } from '../SharedStyles';

export default function GroupManagementView() {
    const [groups, setGroups] = useState([]);
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        location: '',
        timezone: '',
        active: true,
    });

    const fetchGroups = useCallback(async () => {
        const { data, error } = await supabase
            .from('groups')
            .select('id, name, slug, location, timezone, active')
            .order('name');

        if (error) {
            console.error('Error loading groups:', error);
        } else {
            setGroups(data || []);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const addGroup = async () => {
        if (!formData.name || !formData.slug || !formData.location || !formData.timezone) return;
        await supabase.from('groups').insert([formData]);
        setFormData({ name: '', slug: '', location: '', timezone: '', active: true });
        fetchGroups();
    };

    const updateGroup = async (id) => {
        await supabase.from('groups').update(formData).eq('id', id);
        setEditingGroupId(null);
        setFormData({ name: '', slug: '', location: '', timezone: '', active: true });
        fetchGroups();
    };

    const deleteGroup = async (id) => {
        if (confirm('Are you sure you want to delete this group?')) {
            await supabase.from('groups').delete().eq('id', id);
            fetchGroups();
        }
    };

    return (
        <div className="content-box">
            <h2>Manage Groups</h2>

            <AdminTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Location</th>
                        <th>Timezone</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groups.map((g) => (
                        <tr key={g.id}>
                            <td>
                                {editingGroupId === g.id ? (
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                    />
                                ) : g.name}
                            </td>
                            <td>
                                {editingGroupId === g.id ? (
                                    <input
                                        value={formData.slug}
                                        onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
                                    />
                                ) : g.slug}
                            </td>
                            <td>
                                {editingGroupId === g.id ? (
                                    <input
                                        value={formData.location}
                                        onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                                    />
                                ) : g.location}
                            </td>
                            <td>
                                {editingGroupId === g.id ? (
                                    <input
                                        value={formData.timezone}
                                        onChange={(e) => setFormData(f => ({ ...f, timezone: e.target.value }))}
                                    />
                                ) : g.timezone}
                            </td>
                            <td>
                                {editingGroupId === g.id ? (
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData(f => ({ ...f, active: e.target.checked }))}
                                    />
                                ) : g.active ? '✅' : '❌'}
                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingGroupId === g.id ? (
                                    <>
                                        <button onClick={() => updateGroup(g.id)}><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingGroupId(null);
                                            setFormData({ name: '', slug: '', location: '', timezone: '', active: true });
                                        }}><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingGroupId(g.id); setFormData(g); }}><Pencil size={16} /></button>
                                        <button onClick={() => deleteGroup(g.id)}><Trash size={16} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}

                    {editingGroupId === null && (
                        <tr>
                            <td>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    value={formData.slug}
                                    onChange={(e) => setFormData(f => ({ ...f, slug: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    value={formData.location}
                                    onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    value={formData.timezone}
                                    onChange={(e) => setFormData(f => ({ ...f, timezone: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(f => ({ ...f, active: e.target.checked }))}
                                />
                            </td>
                            <td>
                                <button onClick={addGroup}><Plus size={16} /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>
        </div>
    );
}
