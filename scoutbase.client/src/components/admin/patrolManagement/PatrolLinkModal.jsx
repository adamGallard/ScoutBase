// src/components/admin/PatrolLinkModal.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow, Badge, Select } from '@/components/common/SharedStyles';

export default function PatrolLinkModal({ patrolId, onClose, groupId, patrolName, section }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (patrolId && groupId) {
            loadLinkedYouth();
            loadAllYouth();
        }
    }, [patrolId, groupId]);

    const loadLinkedYouth = async () => {
        const { data, error } = await supabase
            .from('youth')
            .select('id, name, section, rank')
            .eq('group_id', groupId)
            .eq('patrol_id', patrolId);
        if (error) {
            console.error('Error fetching linked youth:', error);
            return;
        }
        setLinkedYouth(data || []);
    };

    const loadAllYouth = async () => {
        const { data, error } = await supabase
            .from('youth')
            .select('id, name, section, patrol_id, membership_stage, rank')
            .eq('group_id', groupId)
            .eq('section', section);
        if (error) {
            console.error('Error fetching all youth:', error);
            return;
        }
        setAvailableYouth(data || []);
    };

    const addLink = async (youthId) => {
        await supabase
            .from('youth')
            .update({ patrol_id: patrolId })
            .eq('id', youthId);
        await loadLinkedYouth();
        await loadAllYouth();
        setCurrentPage(1);
    };

    const removeLink = async (youthId) => {
        await supabase
            .from('youth')
            .update({ patrol_id: null, rank: null }) // clear rank on remove
            .eq('id', youthId);
        await loadLinkedYouth();
        await loadAllYouth();
    };

    const updateRank = async (youthId, newRank) => {
        await supabase
            .from('youth')
            .update({ rank: newRank })
            .eq('id', youthId);
        // optimistically update local state
        setLinkedYouth((prev) =>
            prev.map((y) => (y.id === youthId ? { ...y, rank: newRank } : y))
        );
    };

    const unlinkedYouth = availableYouth
        .filter((y) => !y.patrol_id)
        .filter((y) => y.membership_stage !== 'Retired')
        .filter((y) => y.name.toLowerCase().includes(search.toLowerCase()));

    const paginatedYouth = unlinkedYouth.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(unlinkedYouth.length / itemsPerPage);

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Youth in {patrolName}</h3>

                <ul>
                    {[...linkedYouth]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((youth) => (
                            <li
                                key={youth.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <div>
                                    {youth.name} 
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Select
                                        value={youth.rank || ''}
                                        onChange={(e) => updateRank(youth.id, e.target.value)}
                                    >
                                        <option value=""></option>
                                        <option value="PL">PL</option>
                                        <option value="APL">APL</option>
                                    </Select>
                                    <button onClick={() => removeLink(youth.id)}>Remove</button>
                                </div>
                            </li>
                        ))}
                </ul>

                <h4>Add Youth</h4>

                <input
                    type="text"
                    placeholder="Search youth..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ marginBottom: '0.5rem', width: '100%' }}
                />

                <ul style={{ textAlign: 'left', marginBottom: '1rem' }}>
                    {paginatedYouth.map((youth) => (
                        <li
                            key={youth.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem',
                                opacity: youth.patrol_id ? 0.5 : 1,
                            }}
                        >
                            <span>
                                {youth.name} ({youth.section})
                            </span>
                            {youth.patrol_id ? (
                                <span style={{ fontStyle: 'italic' }}>Already Assigned</span>
                            ) : (
                                <button onClick={() => addLink(youth.id)}>Add</button>
                            )}
                        </li>
                    ))}
                </ul>

                {totalPages > 1 && (
                    <div
                        style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
                    >
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}

                <ButtonRow>
                    <button onClick={onClose}>Close</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}