import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, IdCardLanyard } from 'lucide-react';
import { AdminTable, PageTitle, PrimaryButton } from '@/components/common/SharedStyles';

const itemsPerPage = 12;

export default function GroupRoles() {
    const [roles, setRoles] = useState([]);
    const [editingCode, setEditingCode] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [newRole, setNewRole] = useState({
        code: '',
        title: '',
        role_group: '',
        section: '',
        abbreviation: '',
        order: ''
    });
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch roles
    useEffect(() => { fetchRoles(); }, []);
    useEffect(() => { setCurrentPage(1); }, [roles.length]);

    async function fetchRoles() {
        setLoading(true);
        const { data } = await supabase.from('adult_roles').select('*').order('order');
        setRoles(data || []);
        setLoading(false);
    }

    const handleStartEdit = (role) => {
        setEditingCode(role.code);
        setEditForm({ ...role });
    };
    const handleCancelEdit = () => {
        setEditingCode(null);
        setEditForm({});
    };
    const handleEditChange = (field, val) => setEditForm(f => ({ ...f, [field]: val }));

    async function handleSaveEdit() {
        setLoading(true);
        await supabase.from('adult_roles').update(editForm).eq('code', editForm.code);
        setEditingCode(null);
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
        setNewRole({ code: '', title: '', role_group: '', section: '', abbreviation: '', order: '' });
        fetchRoles();
    }

    // Pagination
    const paginatedRoles = roles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );



    return (
        <div className="content-box">
            <PageTitle>
                <IdCardLanyard size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Edit Adult Roles
            </PageTitle>
            <p style={{ marginBottom: 16, color: "#555" }}>
                Edit the roles available for adults/leaders in your group. Use this page to add, edit, or delete available role options.
            </p>

            <AdminTable>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Role Group</th>
                        <th>Section</th>
                        <th>Abbr.</th>
                        <th>Order</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedRoles.map(role => (
                        editingCode === role.code ? (
                            <tr key={role.code}>
                                <td><input value={editForm.code} disabled style={{ width: 80 }} /></td>
                                <td>
                                    <input
                                        value={editForm.title}
                                        onChange={e => handleEditChange('title', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        value={editForm.role_group}
                                        onChange={e => handleEditChange('role_group', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        value={editForm.section || ''}
                                        onChange={e => handleEditChange('section', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        value={editForm.abbreviation || ''}
                                        onChange={e => handleEditChange('abbreviation', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={editForm.order ?? ''}
                                        onChange={e => handleEditChange('order', e.target.value)}
                                        style={{ width: 60 }}
                                    />
                                </td>
                                <td style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={handleSaveEdit} title="Save"><Check size={16} /></button>
                                    <button onClick={handleCancelEdit} title="Cancel"><X size={16} /></button>
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
                                <td style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => handleStartEdit(role)} title="Edit"><Pencil size={16} /></button>
                                    <button onClick={() => handleDelete(role.code)} title="Delete" style={{ color: '#C00' }}><Trash size={16} /></button>
                                </td>
                            </tr>
                        )
                    ))}
                    {/* Add new role row */}
                    <tr>
                        <td>
                            <input
                                value={newRole.code}
                                onChange={e => setNewRole(r => ({ ...r, code: e.target.value }))}
                                style={{ width: 80 }}
                            />
                        </td>
                        <td>
                            <input
                                value={newRole.title}
                                onChange={e => setNewRole(r => ({ ...r, title: e.target.value }))}
                            />
                        </td>
                        <td>
                            <input
                                value={newRole.role_group}
                                onChange={e => setNewRole(r => ({ ...r, role_group: e.target.value }))}
                            />
                        </td>
                        <td>
                            <input
                                value={newRole.section}
                                onChange={e => setNewRole(r => ({ ...r, section: e.target.value }))}
                            />
                        </td>
                        <td>
                            <input
                                value={newRole.abbreviation}
                                onChange={e => setNewRole(r => ({ ...r, abbreviation: e.target.value }))}
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                value={newRole.order}
                                onChange={e => setNewRole(r => ({ ...r, order: e.target.value }))}
                                style={{ width: 60 }}
                            />
                        </td>
                        <td>
                            <button onClick={handleAdd} title="Add"><Plus size={16} /></button>
                        </td>
                    </tr>
                </tbody>
            </AdminTable>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem' }}>
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {Math.ceil(roles.length / itemsPerPage)}
                </span>
                <button
                    onClick={() =>
                        setCurrentPage((p) =>
                            Math.min(Math.ceil(roles.length / itemsPerPage), p + 1)
                        )
                    }
                    disabled={currentPage === Math.ceil(roles.length / itemsPerPage)}
                >
                    Next
                </button>
            </div>
            {loading && <div style={{ color: '#888', margin: 10 }}>Loading…</div>}
        </div>
    );
}
