import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/SharedStyles';

export default function YouthDetailsModal({ youth, onClose }) {
    const [parents, setParents] = useState([]);

    useEffect(() => {
        if (youth?.id) {
            loadParents();
        }
    }, [youth]);

    const loadParents = async () => {
        const { data } = await supabase
            .from('parent_youth')
            .select('parent (id, name, email, phone), is_primary')
            .eq('youth_id', youth.id);

        if (data) {
            setParents(data.map((r) => ({
                ...r.parent,
                is_primary: r.is_primary,
            })));
        }
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Youth Details</h3>

                <p><strong>Name:</strong> {youth.name}</p>
                <p><strong>Date of Birth:</strong> {formatDate(youth.dob)}</p>
                <p><strong>Section:</strong> {youth.section}</p>
                <p><strong>Membership Stage:</strong> {youth.membership_stage}</p>
                {youth.rank && <p><strong>Rank:</strong> {youth.rank}</p>}
                {youth.patrol_name && <p><strong>Patrol:</strong> {youth.patrol_name}</p>}

                <h4 style={{ marginTop: '1.5rem' }}>Linked Parents</h4>
                {parents.length === 0 && <p>No parents linked.</p>}
                <ul>
                    {parents.map((p) => (
                        <li key={p.id}>
                            <div>
                                <strong>{p.name}</strong> {p.is_primary && <span style={{ color: '#0F5BA4' }}>(Primary)</span>}<br />
                                {p.email && <span>Email: {p.email}<br /></span>}
                                {p.contact_number && <span>Phone: {p.contact_number}</span>}
                            </div>
                        </li>
                    ))}
                </ul>

                <ButtonRow>
                    <button onClick={onClose}>Close</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}

// Format date helper
const formatDate = (dob) => {
    if (!dob) return '';
    const date = new Date(dob);
    return date.toLocaleDateString();
};

