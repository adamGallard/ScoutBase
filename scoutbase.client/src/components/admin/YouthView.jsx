import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, BookUser } from 'lucide-react';
import { AdminTable } from '../SharedStyles';
import TransitionModal from './TransitionModal';
import { formatDate } from '../../utils/dateUtils';

export default function YouthView({ groupId }) {
    const [youthList, setYouthList] = useState([]);
    const [youthForm, setYouthForm] = useState({ name: '', dob: '', membership_stage: '' });
    const [editingYouthId, setEditingYouthId] = useState(null);
    const [filter, setFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [selectedYouth, setSelectedYouth] = useState(null);
    const [justAddedYouth, setJustAddedYouth] = useState(null);
    const [stageFilter, setStageFilter] = useState('');

    const fetchYouth = useCallback(async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, dob, section, membership_stage')
            .eq('group_id', groupId)
            .order('name');
        setYouthList(data || []);
    }, [groupId]);

    useEffect(() => {
        if (groupId) fetchYouth();
    }, [groupId, fetchYouth]);

    const addYouth = async () => {
        if (!youthForm.name || !youthForm.dob) return;
        const { data, error } = await supabase
            .from('youth')
            .insert([{ ...youthForm, group_id: groupId }])
            .select()
            .single();

        if (data) {
            setYouthForm({ name: '', dob: '', membership_stage: '' });
            setJustAddedYouth(data);
        }
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
        .filter((y) =>
            (!sectionFilter || y.section === sectionFilter) &&
            (!filter || y.name.toLowerCase().includes(filter)) &&
            (
                !stageFilter
                    ? y.membership_stage !== 'Retired' // default view excludes Retired
                    : y.membership_stage === stageFilter // user-selected stage filter
            )
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="content-box">
            <h2>Youth</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value.toLowerCase())}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
                />

                <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
                >
                    <option value="">All Sections</option>
                    <option value="Joeys">Joeys</option>
                    <option value="Cubs">Cubs</option>
                    <option value="Scouts">Scouts</option>
                    <option value="Venturers">Venturers</option>
                </select>

                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
                >
                    <option value="">All Stages</option>
                    <option value="Have a Go">Have a Go</option>
                    <option value="Linking">Linking</option>
                    <option value="Invested">Invested</option>
                    <option value="Retired">Retired</option>
                </select>
                <button
                    onClick={() => {
                        setFilter('');
                        setSectionFilter('');
                        setStageFilter('');
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                    }}
                >
                    Clear Filters
                </button>
            </div>

            <AdminTable>
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
                            <td>
                                {editingYouthId === y.id ? (
                                    <input
                                        value={youthForm.name}
                                        onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                ) : y.name}
                            </td>
                            <td>
                                {editingYouthId === y.id ? (
                                    <input
                                        type="date"
                                        value={youthForm.dob}
                                        onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))}
                                    />
                                ) :  formatDate(y.dob)}
                            </td>
                            <td>
                                {editingYouthId === y.id ? (
                                    <span>{youthForm.section}</span>
                                ) : y.section}
                            </td>
                            <td>
                                {editingYouthId === y.id ? (
                                    <span>{youthForm.membership_stage}</span>
                                ) : (y.membership_stage )}
                            </td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingYouthId === y.id ? (
                                    <>
                                        <button onClick={() => updateYouth(y.id)} title="Confirm"><Check size={16} /></button>
                                        <button onClick={() => {
                                            setEditingYouthId(null);
                                            setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });
                                        }} title="Cancel"><X size={16} /></button>
                                    </>
                                ) : (
                                        <>
                                            <button onClick={() => setSelectedYouth(y)} title="View/Edit Transitions"><BookUser size={16}  /></button>
                                            <button onClick={() => { setEditingYouthId(y.id); setYouthForm(y); }} title="Edit youth"><Pencil size={16} /></button>
                                            {y.membership_stage === 'Retired' ? (
                                                <button onClick={() => deleteYouth(y.id)} title="Delete Retired Youth">
                                                    <Trash size={16} />
                                                </button>
                                            ) : (
                                                <div title="Only retired youth can be deleted" style={{ opacity: 0.3 }}>
                                                    <Trash size={16} />
                                                </div>
                                            )}

                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {selectedYouth && (
                        <TransitionModal
                            youth={selectedYouth}
                            onClose={() => {
                                setSelectedYouth(null);
                                fetchYouth(); // Refresh the youth list after closing
                            }}
                        />
                    )}
                    {justAddedYouth && (
                        <TransitionModal
                            youth={justAddedYouth}
                            onClose={() => {
                                setJustAddedYouth(null);
                                fetchYouth();
                            }}
                        />
                    )}

                    {editingYouthId === null && (
                        <tr>
                            <td>
                                <input
                                    value={youthForm.name}
                                    onChange={(e) => setYouthForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </td>
                            <td>
                                <input
                                    type="date"
                                    value={youthForm.dob}
                                    onChange={(e) => setYouthForm(f => ({ ...f, dob: e.target.value }))}
                                />
                            </td>
                            <td>
                                
                            </td>
                            <td>
                                
                            </td>
                            <td>
                                <button onClick={addYouth} title="Add youth"><Plus size={16}  /></button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </AdminTable>
        </div>

    );

}
