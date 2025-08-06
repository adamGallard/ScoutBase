import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/common/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';
import { sections } from '@/components/common/Lookups.js';
import { useNavigate } from 'react-router-dom';

// helper to map section code → label
   const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;
export default function LinkModal({ parentId, onClose, groupId, userInfo }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [parentName, setParentName] = useState('');
    const itemsPerPage = 8;
    const [relationshipMap, setRelationshipMap] = useState({});
    const relationshipOptions = ['Mother', 'Father', 'Friend', 'Other'];
    const [otherSelectedMap, setOtherSelectedMap] = useState({});
    const navigate = useNavigate();

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
            const sorted = data
                .map(l => ({ ...l.youth, is_primary: l.is_primary, relationship: l.relationship }))
                .sort((a, b) => a.name.localeCompare(b.name));
            setLinkedYouth(sorted);
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
        // set primary only for mother or father
        const is_primary = (relationship === 'Mother' || relationship === 'Father');
        await supabase.from('parent_youth').insert([
            { parent_id: parentId, youth_id: youthId, group_id: groupId, relationship, is_primary }
        ]);
        await logAuditEvent({
            userId: userInfo?.id,
            groupId: userInfo.group_id,
            role: userInfo?.role,
            action: 'Link',
            targetType: 'Parent-Youth',
            targetId: `${parentId}`,
            metadata: `Linked youth ID ${youthId} to parent ID ${parentId} as "${relationship}" (primary: ${is_primary})`
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
        .filter(y => y.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

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
                            {/* 1. Name (Clickable) */}
                            <span
                                style={{
                                    color: '#0F5BA4',
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                }}
                                onClick={() => {
                                    onClose();
                                    navigate(`/admin/add-youth?id=${youth.id}`);
                                }}
                                title="View youth details"
                            >
                                {youth.name} ({codeToSectionLabel(youth.section)})
                            </span>

                            {/* 2. Relationship textbox */}
                            <span style={{ width: '200px' }}>{youth.relationship}</span>

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
                        const canAdd = rel.length > 0 && rel !== 'placeholder';

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
                                <span>{youth.name} ({codeToSectionLabel(youth.section)})</span>

                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <select
                                        value={
                                            relationshipMap[youth.id] === undefined
                                                ? 'placeholder'
                                                : otherSelectedMap[youth.id]
                                                    ? 'Other'
                                                    : relationshipMap[youth.id]
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;

                                            if (val === 'Other') {
                                                setOtherSelectedMap({
                                                    ...otherSelectedMap,
                                                    [youth.id]: true
                                                });
                                                setRelationshipMap({
                                                    ...relationshipMap,
                                                    [youth.id]: ''
                                                });
                                            } else {
                                                setOtherSelectedMap({
                                                    ...otherSelectedMap,
                                                    [youth.id]: false
                                                });
                                                setRelationshipMap({
                                                    ...relationshipMap,
                                                    [youth.id]: val
                                                });
                                            }
                                        }}
                                    >
                                        <option value="placeholder" disabled>Select relationship</option>
                                        {relationshipOptions.map(opt => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>

                                    {otherSelectedMap[youth.id] && (
                                        <input
                                            type="text"
                                            placeholder="Enter relationship"
                                            value={relationshipMap[youth.id] ?? ''}
                                            onChange={e =>
                                                setRelationshipMap({
                                                    ...relationshipMap,
                                                    [youth.id]: e.target.value
                                                })
                                            }
                                        />
                                    )}
                                </div>

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
