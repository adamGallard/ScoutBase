import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/common/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';

export default function LinkModal({ parentId, onClose, groupId, userInfo }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [parentName, setParentName] = useState('');
    const itemsPerPage = 8;
    const [relationshipMap, setRelationshipMap] = useState({});

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
            .select('youth (id, name, section), is_primary, relationship')
            .eq('parent_id', parentId);
        if (data) {
            setLinkedYouth(data.map(l => ({ ...l.youth, is_primary: l.is_primary, relationship: l.relationship })));
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

    const addLink = async (youthId, relationship) => {
        await supabase.from('parent_youth').insert([
            { parent_id: parentId, youth_id: youthId, group_id: groupId, relationship  }
        ]);
        await logAuditEvent({
            userId: userInfo?.id,
            groupId: userInfo.group_id,
            role: userInfo?.role,
            action: 'Link',
            targetType: 'Parent-Youth',
            targetId: `${parentId}`,
            metadata: `Linked youth ID ${youthId} to parent ID ${parentId} as "${relationship}`
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
                    {linkedYouth.map(youth => (
                        <li
                            key={youth.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 300px auto auto',  // four columns
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.2rem'
                            }}
                        >
                            {/* 1. Name */}
                            <span>
                                {youth.name} ({youth.section})
                            </span>

                            {/* 2. Relationship textbox */}
                            <input
                                type="text"
                                placeholder="Relationship"
                                style={{ width: '200px' }}         // enforce same width
                                value={youth.relationship}
                                onChange={e => {
                                    setLinkedYouth(linkedYouth.map(l =>
                                        l.id === youth.id
                                            ? { ...l, relationship: e.target.value }
                                            : l
                                    ));
                                }}
                                onBlur={async () => {
                                    await supabase
                                        .from('parent_youth')
                                        .update({ relationship: youth.relationship })
                                        .eq('parent_id', parentId)
                                        .eq('youth_id', youth.id);
                                }}
                            />

                            {/* 3. Primary checkbox */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <input
                                    type="checkbox"
                                    checked={youth.is_primary}
                                    onChange={() => togglePrimary(youth.id, !youth.is_primary)}
                                />
                                Primary
                            </label>

                            {/* 4. Remove button */}
                            <button onClick={() => removeLink(youth.id)}>
                                Remove
                            </button>
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

                <ul style={{ textAlign: 'left', marginBottom: '0.2rem' }}>
                    {paginatedYouth.map(youth => {
                        const rel = (relationshipMap[youth.id] || '').trim();
                        const canAdd = rel.length > 0;

                        return (
                            <li
                                key={youth.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 300px auto',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.2rem'
                                }}
                            >
                                <span>{youth.name} ({youth.section})</span>
                                <input
                                    type="text"
                                    placeholder="Relationship"
                                    style={{ width: '200px' }}
                                    value={relationshipMap[youth.id] ?? ''}
                                    onChange={e =>
                                        setRelationshipMap({
                                            ...relationshipMap,
                                            [youth.id]: e.target.value
                                        })
                                    }
                                />
                                <button
                                    onClick={() => addLink(youth.id, rel)}
                                    disabled={!canAdd}
                                    style={{
                                        opacity: canAdd ? 1 : 0.5,
                                        cursor: canAdd ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Add
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <br />
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
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
