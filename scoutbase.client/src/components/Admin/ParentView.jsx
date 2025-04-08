import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Link2, Key, Check, X } from 'lucide-react';

export default function ParentView({ groupId, onOpenPinModal, onOpenLinkModal }) {
    const [parents, setParents] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [editingParentId, setEditingParentId] = useState(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (groupId) fetchParents();
    }, [groupId]);

    const fetchParents = async () => {
        const { data } = await supabase
            .from('parent')
            .select('*')
            .eq('group_id', groupId)
            .order('name');
        setParents(data || []);
    };

    const addParent = async () => {
        if (!formData.name || !formData.email || !formData.phone) return;
        await supabase.from('parent').insert([{ ...formData, group_id: groupId }]);
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
        .filter(p => p.name.toLowerCase().includes(filter) || p.email.toLowerCase().includes(filter))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="content-box">
            <h2>Parents</h2>
            <input
                type="text"
                placeholder="Search"
                value={filter}
                onChange={(e) => setFilter(e.target.value.toLowerCase())}
                style={{ marginBottom: '1rem' }}
            />
            <table className="scout-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedFiltered.map(p => (
                        <tr key={p.id}>
                            <td>{editingParentId === p.id ? <input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} /> : p.name}</td>
                            <td>{editingParentId === p.id ? <input value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} /> : p.email}</td>
                            <td>{editingParentId === p.id ? <input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} /> : p.phone}</td>
                            <td>
                                {editingParentId === p.id ? (
                                    <>
                                        <button onClick={() => updateParent(p.id)}><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingParentId(null);
                                            setFormData({ name: '', email: '', phone: '' }); 
                                        }}>
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingParentId(p.id); setFormData(p); }}><Pencil size={16} /></button>
                                        <button onClick={() => deleteParent(p.id)}><Trash size={16} /></button>
                                        <button onClick={() => onOpenLinkModal(p.id)}><Link2 size={16} /></button>
                                        <button onClick={() => onOpenPinModal(p.id)}><Key size={16} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {editingParentId === null && (
                        <tr>
                            <td><input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} /></td>
                            <td><input value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} /></td>
                            <td><input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} /></td>
                            <td><button onClick={addParent}><Plus size={16} /></button></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}