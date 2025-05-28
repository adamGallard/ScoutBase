import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrimaryButton } from '@/components/common/SharedStyles';
import { formatDate } from '@/utils/dateUtils';
import { sections, codeToSectionLabel } from '@/components/common/Lookups';


// Helper to humanize badge types (simple version)
function formatBadge(type, meta = {}, projectName = ''){
    // normalize keys to lowercase for easier access
    const m = Object.fromEntries(
        Object.entries(meta).map(([k, v]) => [k.toLowerCase(), v])
    );

    switch (type) {
        case 'special_interest_area': {
            const area = m.sia_area.replace('sia_', '').replace(/_/g, ' ');
            // only SIA gets projectName
            return `SIA - ${area}${projectName ? ` (${projectName})` : ''}`;
        }
        case 'outdoor_adventure_skill': {
            // now m.stream and m.stage will always work
            const stream = m.stream || 'Unknown Stream';
            const stage = m.stage || '?';
            return `OAS - ${stream.charAt(0).toUpperCase() + stream.slice(1)} Stage ${stage}`;
        }
        case 'course_reflection':
            return `Course Reflection${m.course_type ? ` – ${m.course_type}` : ''}`;
        case 'personal_reflection':
            return 'Personal Reflection';
        case 'intro_section':
            return `Intro to ${m.section || 'Section'}`;
        case 'intro_scouting':
            return 'Intro to Scouting';
        case 'adventurous_journey':
            return 'Adventurous Journey';
        case 'milestone':
            return `Milestone Stage ${m.stage}`;
        case 'peak_award':
            return `Peak Award${m.award_name ? ` – ${m.award_name}` : ''}`;
        default:
            return 'Unknown Badge';
    }
}

export default function BadgeHistoryModal({ youth, onClose, isMobile }) {
    const [history, setHistory] = useState([]);

    // Load awarded badges for this youth, including the section it was awarded
    useEffect(() => {
        if (!youth?.id) return;
        (async () => {
            const { data } = await supabase
                .from('badge_orders')
                .select('id, badge_type, badge_meta, awarded_date, project_name, section')
                .eq('youth_id', youth.id)
                .eq('status', 'awarded');
            setHistory(data || []);
        })();
    }, [youth]);

    // Group by section, then into SIA and OAS, and sort
    const badgesBySection = useMemo(() => {
        const sectionsMap = {};
        history.forEach(item => {
            const sec = item.section || 'Unknown Section';
            if (!sectionsMap[sec]) sectionsMap[sec] = { sia: [], oas: [] };
            if (item.badge_type === 'special_interest_area') sectionsMap[sec].sia.push(item);
            else if (item.badge_type === 'outdoor_adventure_skill') sectionsMap[sec].oas.push(item);
        });

        Object.values(sectionsMap).forEach(group => {
            group.sia.sort((a, b) => {
                const aName = a.badge_meta.sia_area || '';
                const bName = b.badge_meta.sia_area || '';
                return aName.localeCompare(bName);
            });
            group.oas.sort((a, b) => {
                const mA = a.badge_meta;
                const mB = b.badge_meta;
                const streamDiff = (mA.stream || '').localeCompare(mB.stream || '');
                if (streamDiff !== 0) return streamDiff;
                return (Number(mA.stage) || 0) - (Number(mB.stage) || 0);
            });
        });

        return sectionsMap;
    }, [history]);

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Badges awarded to {youth.name}</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {Object.keys(badgesBySection).length > 0 ? (
                        Object.entries(badgesBySection).map(([section, { sia, oas }]) => (
                            <div key={section} style={{ marginBottom: '1.5rem' }}>
                                <h4>{codeToSectionLabel(section)}</h4>

                                {sia.length > 0 && (
                                    <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                                        <h5>Special Interest Area (SIA)</h5>
                                        {sia.map(item => (
                                            <div key={item.id} style={{ marginBottom: '0.25rem' }}>
                                                <strong>{formatBadge(item.badge_type, item.badge_meta, item.project_name)}</strong>
                                                {item.awarded_date && ` — awarded on ${formatDate(item.awarded_date)}`}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {oas.length > 0 && (
                                    <div style={{ marginLeft: '1rem' }}>
                                        <h5>Outdoor Adventure Skills (OAS)</h5>
                                        {oas.map(item => (
                                            <div key={item.id} style={{ marginBottom: '0.25rem' }}>
                                                <strong>{formatBadge(item.badge_type, item.badge_meta)}</strong>
                                                {item.awarded_date && ` — awarded on ${formatDate(item.awarded_date)}`}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
