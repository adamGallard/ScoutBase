﻿import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Pencil, Trash, Plus, Check, X, BookUser } from 'lucide-react';
import { AdminTable } from '../SharedStyles';
import TransitionModal from './TransitionModal';
import { formatDate } from '../../utils/dateUtils';
import { getTerrainSyncPreview, syncYouthFromTerrain } from '../../helpers/terrainSyncHelper';
import TerrainSyncModal from './TerrainSyncModal';
import {
    PageWrapper,
    Main,
    Content,
    LogoWrapper,
    PrimaryButton
} from '../../components/SharedStyles';
import UnitSelectModal from './UnitSelectModal';


export default function YouthView({ groupId }) {
    const [youthList, setYouthList] = useState([]);
    const [youthForm, setYouthForm] = useState({ name: '', dob: '', membership_stage: '' });
    const [editingYouthId, setEditingYouthId] = useState(null);
    const [filter, setFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [selectedYouth, setSelectedYouth] = useState(null);
    const [justAddedYouth, setJustAddedYouth] = useState(null);
    const [stageFilter, setStageFilter] = useState('');
    const [preview, setPreview] = useState(null); // { toAdd: [], toUpdate: [] }
    const [unitOptions, setUnitOptions] = useState([]);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const profileAvailable = localStorage.getItem('scoutbase-terrain-units-available') === 'true';

    const handleTerrainSync = async () => {
        const token = localStorage.getItem('scoutbase-terrain-idtoken');
        if (!token) return alert('Please log in.');

        try {
            const cached = localStorage.getItem('scoutbase-terrain-units');
            const parsedUnits = cached ? JSON.parse(cached) : [];

            if (!Array.isArray(parsedUnits) || parsedUnits.length === 0) {
                throw new Error('No units available.');
            }

            // Optional: infer section to suggest relevant units
            const inferredSection = sectionFilter || 'Cubs';
            const autoSelected = parsedUnits.filter(u =>
                u.section?.toLowerCase().includes(inferredSection.toLowerCase())
            );

            setUnitOptions(parsedUnits); // ✅ This is where the modal reads from
            setShowUnitModal(true);
        } catch (err) {
            console.error('Failed to load Terrain units:', err);
            alert('Unable to fetch your units from Terrain.');
        }
    };


    const handleUnitsConfirmed = async (unitIds) => {
        setShowUnitModal(false);

        const token = localStorage.getItem('scoutbase-terrain-idtoken');
        const selectedUnits = unitOptions.filter(u => unitIds.includes(u.unitId));

        try {
            const preview = await getTerrainSyncPreview(token, groupId, selectedUnits);
            setPreview(preview);
        } catch (err) {
            console.error('Failed to preview sync:', err);
            alert('Unable to prepare sync preview.');
        }
    };

    const confirmSync = async () => {
        if (!preview) return;
        const result = await syncYouthFromTerrain(groupId, preview.toAdd, preview.toUpdate);
        alert(`Sync complete: ${result.added} added, ${result.updated} updated.`);
        setPreview(null);
        fetchYouth();
    };

    const cancelSync = () => {
        setPreview(null);
    };

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

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, sectionFilter, stageFilter]);

    const addYouth = async () => {
        if (!youthForm.name || !youthForm.dob) return;

        const { data, error } = await supabase
            .from('youth')
            .insert([{ ...youthForm, group_id: groupId }])
            .select()
            .single();

        if (data) {
            setYouthForm({ name: '', dob: '', membership_stage: '' });
            setSelectedYouth(data); // 🔄 replaces justAddedYouth
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

    const paginatedList = filteredList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const canSync = localStorage.getItem('scoutbase-terrain-units-available') === 'true';

    return (
        <div className="content-box">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap'
            }}>
                <h2 style={{ margin: 0 }}>Youth</h2>


                
                <PrimaryButton
                    disabled={!canSync}
                    onClick={handleTerrainSync}
                    title={!canSync ? "Sync unavailable – no Terrain units" : "Sync Youth from Terrain"}
                >
                    Sync Youth from Terrain
                </PrimaryButton>
            </div>

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
                    {paginatedList.map((y) => (
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
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    Previous
                </button>
                <span>Page {currentPage} of {Math.ceil(filteredList.length / itemsPerPage)}</span>
                <button
                    onClick={() =>
                        setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredList.length / itemsPerPage)))
                    }
                    disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage)}
                >
                    Next
                </button>
            </div>

            {preview && (
                <TerrainSyncModal
                    toAdd={preview.toAdd}
                    toUpdate={preview.toUpdate}
                    onConfirm={confirmSync}
                    onCancel={cancelSync}
                />
            )}
            {showUnitModal && (
                <UnitSelectModal
                    units={unitOptions}
                    onConfirm={handleUnitsConfirmed}
                    onCancel={() => setShowUnitModal(false)}
                />
            )}
        </div>

    );

}
