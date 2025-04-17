import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';

export default function LinkModal({ parentId, onClose, groupId, userInfo }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [parentName, setParentName] = useState('');
    const itemsPerPage = 10;
    useEffect(() => {
        if (parentId) {
            loadParentName();
            loadLinkedYouth();
            loadAllYouth();
        }
    }, [parentId]);

    const loadParentName = async () => {
        const { data, error } = await supabase
            .from('parent')
            .select('name')
            .eq('id', parentId)
            .single();
        if (data) setParentName(data.name);
    };

    const loadLinkedYouth = async () => {
        const { data } = await supabase
            .from('parent_youth')
            .select('youth (id, name, section), is_primary')
            .eq('parent_id', parentId);
        if (data) {
            setLinkedYouth(data.map(l => ({ ...l.youth, is_primary: l.is_primary })));
        }
    };

    const loadAllYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, section')
            .eq('group_id', groupId);
        if (data) {
            setAvailableYouth(data);
        }
    };

    const addLink = async (youthId) => {
        await supabase.from('parent_youth').insert([
            { parent_id: parentId, youth_id: youthId, group_id: groupId }
        ]);
        await logAuditEvent({
            userId: userInfo?.id,
            groupId: userInfo.group_id,
            role: userInfo?.role,
            action: 'Link',
            targetType: 'Parent-Youth',
            targetId: `${parentId}`,
            metadata: `Linked youth ID ${youthId} to parent ID ${parentId}`
        });
        loadLinkedYouth();
        setCurrentPage(1);
    };

    const removeLink = async (youthId) => {
        await supabase
            .from('parent_youth')
            .delete()
            .eq('parent_id', parentId)
            .eq('youth_id', youthId);
    

        await logAuditEvent({
                userId: userInfo?.id,
                groupId: userInfo.group_id,
                role: userInfo?.role,
                action: 'Unlink',
                targetType: 'Parent-Youth',
                targetId: `${parentId}`,
                metadata: `Unlinked youth ID ${youthId} from parent ID ${parentId}`
            });
    
        loadLinkedYouth();
    };

    const unlinkedYouth = availableYouth
        .filter(y => !linkedYouth.some(l => l.id === y.id))
        .filter(y => y.name.toLowerCase().includes(search.toLowerCase()));

    const paginatedYouth = unlinkedYouth.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(unlinkedYouth.length / itemsPerPage);

    const togglePrimary = async (youthId, newValue) => {
        await supabase
            .from('parent_youth')
            .update({ is_primary: newValue })
            .eq('parent_id', parentId)
            .eq('youth_id', youthId);
        loadLinkedYouth();
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Linked Youth{parentName && ` for ${parentName}`}</h3>

                <ul>
                    {[...linkedYouth]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((youth) => (
                            <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div>
                                    <span>{youth.name} ({youth.section})</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={youth.is_primary || false}
                                            onChange={() => togglePrimary(youth.id, !youth.is_primary)}
                                        />
                                        {' '}Primary
                                    </label>
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
                />

                <ul style={{ textAlign: 'left', marginBottom: '1rem' }}>
                    {[...paginatedYouth]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((youth) => (
                        <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>{youth.name} ({youth.section})</span>
                            <button onClick={() => addLink(youth.id)}>Add</button>
                        </li>
                    ))}
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
