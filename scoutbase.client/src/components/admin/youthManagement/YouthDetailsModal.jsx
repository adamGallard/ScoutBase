import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/common/SharedStyles';
import { codeToStageLabel, codeToSectionLabel } from '@/components/common/Lookups.js';
import { formatDate, getAgeWithMonths } from '@/utils/dateUtils.js';

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
            .select('parent (id, name, email, phone), is_primary, relationship')
            .eq('youth_id', youth.id);

        if (data) {
            setParents(data.map((r) => ({
                ...r.parent,
                is_primary: r.is_primary,
				relationship: r.relationship || 'Parent',
            })));
        }
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Youth Details</h3>

                <p><strong>Name:</strong> {youth.name}</p>
                <p><strong>Date of Birth:</strong> {formatDate(youth.dob)} - {getAgeWithMonths(youth.dob)} </p>
				<p><strong>Member Number:</strong> {youth.member_number}</p>
                <p><strong>Section:</strong> {codeToSectionLabel(youth.section)}</p>
                <p><strong>Membership Stage:</strong> {codeToStageLabel(youth.membership_stage)}</p>
                {youth.rank && <p><strong>Rank:</strong> {youth.rank}</p>}
                {youth.patrol_name && <p><strong>Patrol:</strong> {youth.patrol_name}</p>}

                <h4 style={{ marginTop: '1.5rem' }}>Linked Parents</h4>
                {parents.length === 0 && <p>No parents linked.</p>}
                <ul>
                    {[...parents]
                        .sort((a, b) => {
                            // 1) Put “mother” then “father” first (case-insensitive)
                            const priority = ['mother', 'father'];
                            const aRel = a.relationship.toLowerCase();
                            const bRel = b.relationship.toLowerCase();
                            const aIdx = priority.indexOf(aRel);
                            const bIdx = priority.indexOf(bRel);
                            if (aIdx !== -1 || bIdx !== -1) {
                                // if both are in priority list, sort by their index
                                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                                // otherwise, the one in the list comes first
                                return aIdx !== -1 ? -1 : 1;
                            }

                            // 2) Neither “mother” nor “father” → alphabetical by relationship
                            return aRel.localeCompare(bRel);
                        })
                        .map(p => (
                            <li key={p.id}>
                                <div>
                                    <strong>{p.name}</strong>
                                    {p.relationship && <span> - {p.relationship}</span>}
                                    {p.is_primary && <span style={{ color: '#0F5BA4' }}> (Primary)</span>}
                                    <br />
                                    {p.email && <span>Email: {p.email}<br /></span>}
                                    {p.phone && <span>Phone: {p.phone}</span>}
                                </div>
                            </li>
                        ))
                    }
                </ul>

                <ButtonRow>
                    <button onClick={onClose}>Close</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}


