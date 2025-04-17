import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/SharedStyles';

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
    }, [patrolId]);

    const loadLinkedYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, section')
            .eq('group_id', groupId)
            .eq('patrol_id', patrolId);
        setLinkedYouth(data || []);
    };

    const loadAllYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, section, patrol_id, membership_stage') // 👈 add membership_stage
            .eq('group_id', groupId)
            .eq('section', section);

        if (data) {
            setAvailableYouth(data);
        }
    };

    const addLink = async (youthId) => {
        await supabase
            .from('youth')
            .update({ patrol_id: patrolId })
            .eq('id', youthId);

        await loadLinkedYouth();
        await loadAllYouth(); // ✅ Refresh available list too
        setCurrentPage(1);
    };

    const removeLink = async (youthId) => {
        await supabase
            .from('youth')
            .update({ patrol_id: null })
            .eq('id', youthId);

        await loadLinkedYouth();
        await loadAllYouth(); // ✅ Refresh available list too
    };

    const unlinkedYouth = availableYouth
        .filter(y => !y.patrol_id)                         // not assigned to any patrol
        .filter(y => y.membership_stage !== 'Retired')     // not retired
        .filter(y => y.name.toLowerCase().includes(search.toLowerCase())); // matches search

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
                    {[...linkedYouth].sort((a, b) => a.name.localeCompare(b.name)).map((youth) => (
                        <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>{youth.name} ({youth.section})</span>
                            <button onClick={() => removeLink(youth.id)}>Remove</button>
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
                />

                <ul style={{ textAlign: 'left', marginBottom: '1rem' }}>
                    {paginatedYouth.map((youth) => {
                        const isAssigned = youth.patrol_id !== null;
                        return (
                            <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', opacity: isAssigned ? 0.5 : 1 }}>
                                <span>{youth.name} ({youth.section})</span>
                                {isAssigned ? (
                                    <span style={{ fontStyle: 'italic' }}>Already Assigned</span>
                                ) : (
                                    <button onClick={() => addLink(youth.id)}>Add</button>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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

