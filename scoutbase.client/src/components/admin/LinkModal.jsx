import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LinkModal({ parentId, onClose, groupId }) {
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);

    useEffect(() => {
        if (parentId) {
            loadLinkedYouth();
            loadAllYouth();
        }
    }, [parentId]);

    const loadLinkedYouth = async () => {
        const { data } = await supabase
            .from('parent_youth')
            .select('youth (id, name, section)')
            .eq('parent_id', parentId);
        setLinkedYouth(data.map(l => l.youth));
    };

    const loadAllYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, section')
            .eq('group_id', groupId);
        setAvailableYouth(data);
    };

    const addLink = async (youthId) => {
        await supabase.from('parent_youth').insert([
            { parent_id: parentId, youth_id: youthId, group_id: groupId }
        ]);
        loadLinkedYouth();
    };

    const removeLink = async (youthId) => {
        await supabase
            .from('parent_youth')
            .delete()
            .eq('parent_id', parentId)
            .eq('youth_id', youthId);
        loadLinkedYouth();
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>Youth linked to this parent</h3>
                <ul>
                    {linkedYouth.map((youth) => (
                        <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{youth.name} ({youth.section})</span>
                            <button onClick={() => removeLink(youth.id)}>Remove</button>
                        </li>
                    ))}
                </ul>

                <h4>Add Youth</h4>
                <select onChange={(e) => addLink(e.target.value)} defaultValue="">
                    <option value="" disabled>Select a youth...</option>
                    {availableYouth
                        .filter(y => !linkedYouth.find(l => l.id === y.id))
                        .map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name} ({y.section})
                            </option>
                        ))}
                </select>

                <div style={{ marginTop: '1rem' }}>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
