import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton,PageTitle } from '@/components/common/SharedStyles';
import { FolderKanban } from 'lucide-react';

const SECTIONS = ['All Sections', 'Joeys', 'Cubs', 'Scouts', 'Venturers'];

export default function ReportYouthBySection({ groupId }) {
    const [youth, setYouth] = useState([]);
    const [selectedSection, setSelectedSection] = useState('All Sections');

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('youth')
                .select('name, dob, section, member_number, membership_stage')
                .eq('group_id', groupId);

            if (!error) {
                setYouth(data || []);
            }
        };

        if (groupId) fetchData();
    }, [groupId]);

    const filteredYouth = selectedSection === 'All Sections'
        ? youth
        : youth.filter(y => y.section === selectedSection);

    const handleDownload = () => {
        downloadCSV(filteredYouth, `youth_by_section_${selectedSection.replace(' ', '_').toLowerCase()}.csv`);
    };

    return (
        <div className="content-box">
            <PageTitle>
                <FolderKanban size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Youth by Section Report</PageTitle>

            <div style={{ margin: '1rem 0' }}>
                <label style={{ marginRight: '0.5rem' }}>Select Section:</label>
                <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                    {SECTIONS.map(section => (
                        <option key={section} value={section}>{section}</option>
                    ))}
                </select>
            </div>

            <PrimaryButton onClick={handleDownload}>
                Download CSV
            </PrimaryButton>
        </div>
    );
}
