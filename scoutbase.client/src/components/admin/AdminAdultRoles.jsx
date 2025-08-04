// src/components/admin/GroupRoles.jsx

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle, PrimaryButton } from '@/components/common/SharedStyles';

export default function AdminAdultRoles() {
    const [roles, setRoles] = useState([]);
    const [editing, setEditing] = useState({});
    const [newRole, setNewRole] = useState({
        code: '',
        title: '',
        role_group: '',
        section: '',
        abbreviation: '',
        order: ''
    });
    const [loading, setLoading] = useState(false);

    // Fetch roles
    useEffect(() => {
        fetchRoles();
    }, []);

    async function fetchRoles() {
        setLoading(true);
        const { data } = await supabase.from('adult_roles').select('*').order('order');
        setRoles(data || []);
        setLoading(false);
    }

    function startEdit(code) {
        setEditing({ ...editing, [code]: true });
    }

    function stopEdit(code) {
        setEditing({ ...editing, [code]: false });
    }

    async function handleSave(role) {
        setLoading(true);
        await supabase.from('adult_roles').update(role).eq('code', role.code);
        stopEdit(role.code);
        fetchRoles();
    }

    async function handleDelete(code) {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        setLoading(true);
        await supabase.from('adult_roles').delete().eq('code', code);
        fetchRoles();
    }

    async function handleAdd() {
        if (!newRole.code || !newRole.title || !newRole.role_group) {
            alert("Code, Title, and Role Group are required");
            return;
        }
        setLoading(true);
        await supabase.from('adult_roles').insert({
            ...newRole,
            order: newRole.order ? parseInt(newRole.order, 10) : null
        });
        setNewRole({
            code: '',
            title: '',
            role_group: '',
            section: '',
            abbreviation: '',
            order: ''
        });
        fetchRoles();
    }

    return (
        <div className="content-box">
            <PageTitle>Edit Adult Roles</PageTitle>
            <p style={{ marginBottom: 16, color: "#555" }}>
                Manage the roles available for adults/leaders in your group. You can edit, add, or remove roles here.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                <thead>
                    <tr style={{ background: '#f5f7fa' }}>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Code</th>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Title</th>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Role Group</th>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Section</th>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Abbreviation</th>
                        <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}>Order</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role) => editing[role.code] ? (
                        <tr key={role.code}>
                            <td><input value={role.code} disabled style={{ width: '80px' }} /></td>
                            <td>
                                <input
                                    value={role.title}
                                    onChange={e => setRoles(roles.map(r => r.code === role.code ? { ...r, title: e.target.value } : r))}
                                />
                            </td>
                            <td>
                                <input
                                    value={role.role_group}
                                    onChange={e => setRoles(roles.map(r => r.code === role.code ? { ...r, role_group: e.target.value } : r))}
                                />
                            </td>
                            <td>
                                <input
                                    value={role.section || ''}
                                    onChange={e => setRoles(roles.map(r => r.code === role.code ? { ...r, section: e.target.value } : r))}
                                />
                            </td>
                            <td>
                                <input
                                    value={role.abbreviation || ''}
                                    onChange={e => setRoles(roles.map(r => r.code === role.code ? { ...r, abbreviation: e.target.value } : r))}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={role.order ?? ''}
                                    onChange={e => setRoles(roles.map(r => r.code === role.code ? { ...r, order: e.target.value } : r))}
                                    style={{ width: '60px' }}
                                />
                            </td>
                            <td>
                                <PrimaryButton onClick={() => handleSave(role)} style={{ marginRight: 4 }}>Save</PrimaryButton>
                                <button onClick={() => stopEdit(role.code)}>Cancel</button>
                            </td>
                        </tr>
                    ) : (
                        <tr key={role.code}>
                            <td>{role.code}</td>
                            <td>{role.title}</td>
                            <td>{role.role_group}</td>
                            <td>{role.section}</td>
                            <td>{role.abbreviation}</td>
                            <td>{role.order}</td>
                            <td>
                                <button onClick={() => startEdit(role.code)}>Edit</button>
                                <button style={{ color: 'red', marginLeft: 4 }} onClick={() => handleDelete(role.code)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td><input value={newRole.code} onChange={e => setNewRole(r => ({ ...r, code: e.target.value }))} style={{ width: '80px' }} /></td>
                        <td><input value={newRole.title} onChange={e => setNewRole(r => ({ ...r, title: e.target.value }))} /></td>
                        <td><input value={newRole.role_group} onChange={e => setNewRole(r => ({ ...r, role_group: e.target.value }))} /></td>
                        <td><input value={newRole.section} onChange={e => setNewRole(r => ({ ...r, section: e.target.value }))} /></td>
                        <td><input value={newRole.abbreviation} onChange={e => setNewRole(r => ({ ...r, abbreviation: e.target.value }))} /></td>
                        <td><input type="number" value={newRole.order} onChange={e => setNewRole(r => ({ ...r, order: e.target.value }))} style={{ width: '60px' }} /></td>
                        <td>
                            <PrimaryButton onClick={handleAdd}>Add</PrimaryButton>
                        </td>
                    </tr>
                </tbody>
            </table>
            {loading && <div style={{ color: '#888', margin: 10 }}>Loading...</div>}
        </div>
    );
}
