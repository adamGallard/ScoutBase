import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrimaryButton } from '@/components/common/SharedStyles';
import { formatDate } from '@/utils/dateUtils';
import { sections } from '@/components/common/Lookups';

// Map section codes to labels (if you need to show section alongside badge)
const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

// Helper to humanize badge types (simple version)
function formatBadge(type, meta = {}) {
    switch (type) {
        case 'special_interest_area':
            return `SIA - ${meta.sia_area?.replace('sia_', '').replace(/_/g, ' ')}`;
        case 'outdoor_adventure_skill':
            return `OAS - ${meta.stream} Stage ${meta.stage}`;
        case 'course_reflection':
            return `Course Reflection${meta.course_type ? ` – ${meta.course_type}` : ''}`;
        case 'personal_reflection':
            return 'Personal Reflection';
        case 'intro_section':
            return `Intro to ${meta.section ?? 'Section'}`;
        case 'intro_scouting':
            return 'Intro to Scouting';
        case 'adventurous_journey':
            return 'Adventurous Journey';
        case 'milestone':
            return `Milestone Stage ${meta.stage ?? '?'}`;
        case 'peak_award':
            return `Peak Award${meta.award_name ? ` – ${meta.award_name}` : ''}`;
        default:
            return 'Unknown Badge';
    }
}

export default function BadgeHistoryModal({ youth, onClose, isMobile }) {
    const [history, setHistory] = useState([]);

    // Load awarded badges for this youth
    useEffect(() => {
        if (!youth?.id) return;
        (async () => {
            const { data } = await supabase
                .from('badge_orders')
                .select('id, badge_type, badge_meta, awarded_date, project_name')
                .eq('youth_id', youth.id)
                .eq('status', 'awarded')
                .order('awarded_date', { ascending: false });
            setHistory(data || []);
        })();
    }, [youth]);
	console.log('Badge history:', history);
    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Badges awarded to {youth.name}</h3>

                {/* History list */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {history.length > 0 ? (
                        history.map(item => (
                            <div key={item.id} style={{ marginBottom: '0.5rem' }}>
                                <strong>{formatBadge(item.badge_type, item.badge_meta)} - ({item.project_name})</strong>
                                {item.awarded_date && ` - awarded on ${formatDate(item.awarded_date)}`}
                            </div>
                        ))
                    ) : (
                        <p>No awarded badges found.</p>
                    )}
                </div>

                <PrimaryButton isMobile={isMobile} onClick={onClose}>
                    Close
                </PrimaryButton>
            </div>
        </div>
    );
}

// Styles
const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
};
