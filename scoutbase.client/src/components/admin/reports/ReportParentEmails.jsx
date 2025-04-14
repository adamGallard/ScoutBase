import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { downloadCSV } from '../../../utils/exportUtils';
import { PrimaryButton } from '../../SharedStyles';

export default function ReportParentEmails({ groupId }) {
    const [rows, setRows] = useState([]);
    const [orphans, setOrphans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sectionFilter, setSectionFilter] = useState('All');
    const [rawData, setRawData] = useState([]);
    const [allYouth, setAllYouth] = useState([]);

    const sections = ['All', 'Joeys', 'Cubs', 'Scouts', 'Venturers'];

    // Load parent_youth links and youth table
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const { data: parentLinks, error } = await supabase
                .from('parent_youth')
                .select('is_primary, parent(id, name, email), youth(id, name, section)')
                .eq('group_id', groupId);

            if (error) {
                console.error('❌ Error loading parent_youth links:', error.message);
                setLoading(false);
                return;
            }

            const { data: youthData, error: youthError } = await supabase
                .from('youth')
                .select('id, name, section, dob, member_number')
                .eq('group_id', groupId);

            if (youthError) {
                console.error('❌ Error loading youth:', youthError.message);
                setLoading(false);
                return;
            }

            setRawData(parentLinks);
            setAllYouth(youthData);
            setLoading(false);
        };

        fetchData();
    }, [groupId]);

    // Process rows for export
    useEffect(() => {
        // 1. Filtered Parent Emails
        const filtered = rawData.filter(row =>
            row.is_primary &&
            (sectionFilter === 'All' || row.youth.section === sectionFilter)
        );

        const grouped = {};
        for (const row of filtered) {
            const { parent, youth } = row;
            if (!grouped[parent.id]) {
                grouped[parent.id] = {
                    ParentName: parent.name,
                    Email: parent.email,
                    Youth: []
                };
            }
            grouped[parent.id].Youth.push(`${youth.name} (${youth.section})`);
        }

        const primaryParents = Object.values(grouped).map(p => ({
            ParentName: p.ParentName,
            Email: p.Email,
            LinkedYouth: p.Youth.join(', ')
        }));

        setRows(primaryParents);

        // 2. Youth without a primary parent
        const youthWithPrimary = new Set(
            rawData
                .filter(r => r.is_primary)
                .map(r => r.youth.id)
        );

        const filteredOrphans = allYouth
            .filter(y =>
                !youthWithPrimary.has(y.id) &&
                (sectionFilter === 'All' || y.section === sectionFilter)
            )
            .map(y => ({
                Name: y.name,
                DOB: y.dob,
                Section: y.section,
                MemberNumber: y.member_number
            }));

        setOrphans(filteredOrphans);
    }, [sectionFilter, rawData, allYouth]);

    return (
        <div style={{ padding: '0rem' }}>
            <h2>Parent Email Distribution List</h2>
            <p>This report includes two downloadable CSVs: one for primary parent emails and one for youth without a primary parent.</p>

            <div style={{ margin: '1rem 0' }}>
                <label htmlFor="sectionFilter" style={{ marginRight: '0.5rem' }}>Filter by section:</label>
                <select
                    id="sectionFilter"
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                    {sections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <PrimaryButton
                    onClick={() => downloadCSV(rows, 'parent_email_distribution')}
                    disabled={loading || rows.length === 0}
                >
                    Download Primary Parent Emails
                </PrimaryButton>

                <PrimaryButton
                    onClick={() => downloadCSV(orphans, 'youth_without_primary_parent')}
                    disabled={loading || orphans.length === 0}
                >
                    Download Youth Without Primary
                </PrimaryButton>
            </div>

            {loading && <p>Loading...</p>}
            {!loading && rows.length === 0 && <p>No matching parent email data available.</p>}
        </div>
    );
}
