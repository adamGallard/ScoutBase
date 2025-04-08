import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X } from 'lucide-react';

export default function YouthView({ groupId }) {
    const [youthList, setYouthList] = useState([]);
    const [youthForm, setYouthForm] = useState({ name: '', dob: '', section: '', membership_stage: '' });
    const [editingYouthId, setEditingYouthId] = useState(null);
    const [filter, setFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    useEffect(() => {
        if (groupId) fetchYouth();
    }, [groupId]);

    const fetchYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, dob, section, membership_stage')
            .eq('group_id', groupId)
            .order('name');
        setYouthList(data || []);
    };

    const addYouth = async () => {
        if (!youthForm.name || !youthForm.dob || !youthForm.section) return;
        await supabase.from('youth').insert([{ ...youthForm, group_id: groupId }]);
        setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
        fetchYouth();
    };

    const updateYouth = async (id) => {
        await supabase.from('youth').update(youthForm).eq('id', id);
        setEditingYouthId(null);
        setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
        fetchYouth();
    };

    const deleteYouth = async (id) => {
        if (confirm('Are you sure you want to delete this youth?')) {
            await supabase.from('youth').delete().eq('id', id);
            fetchYouth();
        }
    };

    const filteredList = [...youthList]
        .filter(y =>
            (!sectionFilter || y.section === sectionFilter) &&
            y.name.toLowerCase().includes(filter)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="content-box">
            <h2>Youth</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value.toLowerCase())}
                />
                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    <option value="">All Sections</option>
                    <option value="Joeys">Joeys</option>
                    <option value="Cubs">Cubs</option>
                    <option value="Scouts">Scouts</option>
                    <option value="Venturers">Venturers</option>
                </select>
            </div>
            <table className="scout-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>DOB</th>
                        <th>Section</th>
                        <th>Stage</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredList.map((y) => (
                        <tr key={y.id}>
                            <td>{editingYouthId === y.id
                                ? <input value={youthForm.name} onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))} />
                                : y.name}</td>
                            <td>{editingYouthId === y.id
                                ? <input type="date" value={youthForm.dob} onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))} />
                                : y.dob}</td>
                            <td>{editingYouthId === y.id
                                ? <select value={youthForm.section} onChange={(e) => setYouthForm(f => ({ ...f, section: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="Joeys">Joeys</option>
                                    <option value="Cubs">Cubs</option>
                                    <option value="Scouts">Scouts</option>
                                    <option value="Venturers">Venturers</option>
                                </select>
                                : y.section}</td>
                            <td>{editingYouthId === y.id
                                ? <select value={youthForm.membership_stage || ''} onChange={(e) => setYouthForm(f => ({ ...f, membership_stage: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="Have a Go">Have a Go</option>
                                    <option value="Linking">Linking</option>
                                    <option value="Invested">Invested</option>
                                </select>
                                : (y.membership_stage || '-')}</td>
                            <td>
                                {editingYouthId === y.id ? (
                                    <>
                                        <button onClick={() => updateYouth(y.id)}><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingYouthId(null);
                                            setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
                                        }}><X size={16} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingYouthId(y.id); setYouthForm(y); }}><Pencil size={16} /></button>
                                        <button onClick={() => deleteYouth(y.id)}><Trash size={16} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {editingYouthId === null && (
                        <tr>
                            <td><input value={youthForm.name} onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))} /></td>
                            <td><input type="date" value={youthForm.dob} onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))} /></td>
                            <td>
                                <select value={youthForm.section} onChange={(e) => setYouthForm(f => ({ ...f, section: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="Joeys">Joeys</option>
                                    <option value="Cubs">Cubs</option>
                                    <option value="Scouts">Scouts</option>
                                    <option value="Venturers">Venturers</option>
                                </select>
                            </td>
                            <td>
                                <select value={youthForm.membership_stage} onChange={(e) => setYouthForm(f => ({ ...f, membership_stage: e.target.value }))}>
                                    <option value="">Select</option>
                                    <option value="Have a Go">Have a Go</option>
                                    <option value="Linking">Linking</option>
                                    <option value="Invested">Invested</option>
                                </select>
                            </td>
                            <td><button onClick={addYouth}><Plus size={16} /></button></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
