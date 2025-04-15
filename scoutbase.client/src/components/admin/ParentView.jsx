import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Link, Key, Check, X,UserPlus } from 'lucide-react';
import { AdminTable, PageTitle } from '../SharedStyles';
import bcrypt from 'bcryptjs';

export default function ParentView({ groupId, onOpenPinModal, onOpenLinkModal, userInfo }) {
    const [parents, setParents] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [editingParentId, setEditingParentId] = useState(null);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15); // or however many you want per page

    const defaultPIN = '1258';

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

        // Filter in JS if Section Leader
        let filtered = data;
        if (userInfo?.role === 'Section Leader' && userInfo?.section) {
            filtered = data.filter((parent) =>
                parent.parent_youth?.some(
                    (py) =>
                        py.youth?.section === userInfo.section ||
                        py.youth?.linking_section === userInfo.section
                )
            );
        }

        setParents(filtered);
    }, [groupId, userInfo]);




    useEffect(() => {
        if (groupId) fetchParents();
    }, [groupId, fetchParents]);

    const addParent = async () => {
         const hashedPIN = await bcrypt.hash(defaultPIN, 10);
        if (!formData.name || !formData.email || !formData.phone) return;
        await supabase.from('parent').insert([{ ...formData, group_id: groupId ,pin_hash: hashedPIN}]);
        setFormData({ name: '', email: '', phone: '' });
        fetchParents();
    };

    const updateParent = async (id) => {
        await supabase.from('parent').update(formData).eq('id', id);
        setEditingParentId(null);
        setFormData({ name: '', email: '', phone: '' });
        fetchParents();
    };

    const deleteParent = async (id) => {
        if (confirm('Are you sure you want to delete this parent?')) {
            await supabase.from('parent').delete().eq('id', id);
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

            <AdminTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th style={{ width: '140px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedParents.map(p => (
                        <tr key={p.id}>
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
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingParentId === p.id ? (
                                    <>
                                        <button onClick={() => updateParent(p.id)} title="Confirm"><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingParentId(null);
                                            setFormData({ name: '', email: '', phone: '' });
                                        }} title="Cancel">
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                            <button onClick={() => { setEditingParentId(p.id); setFormData(p); }} title="Edit parent"><Pencil size={16} /></button>
                                            <button onClick={() => onOpenLinkModal(p.id)} title="Link youth to parent"><Link size={16} /></button>
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
                                <button onClick={addParent} title="Add parent"><Plus size={16} /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>

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
        </div>
    );
}
