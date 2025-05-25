// src/components/admin/reports/ReportYouthBySection.jsx

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton, PageTitle, StyledTable } from '@/components/common/SharedStyles';
import { FolderKanban } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils.js';
import { sections, sectionMap, stages, stageMap } from '@/components/common/Lookups';

// Build dropdown options: blank code for all, then sorted sections
const sectionOptions = [
    { code: '', label: 'All Sections' },
    ...sections.slice().sort((a, b) => a.order - b.order)
];

const stageOptions = [
    { code: '', label: 'All Stages' },
    ...stages.slice().sort((a, b) => a.order - b.order)
];
// Helpers to map codes to human labels
const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label || code;
const codeToStageLabel = code =>
    stages.find(s => s.code === code)?.label || code;

export default function ReportYouthBySection({ groupId }) {
    const [youth, setYouth] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [selectedStage, setSelectedStage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('youth')
                .select('id, name, dob, section, member_number, membership_stage, rank, patrols ( name )')
                .eq('group_id', groupId)
                .neq('membership_stage', 'retired');  

            if (!error && data) {
                const enriched = data.map(y => ({
                    ...y,
                    patrol: y.patrols?.name || ''
                }));
                setYouth(enriched);
            }
        };

        if (groupId) fetchData();
    }, [groupId]);

    // Filter by code
    const filteredYouth = useMemo(() => {
        let rows = youth;
    
         // section filter
          if (selectedSection !== '') {
                rows = rows.filter(y => y.section === selectedSection);
              }
    
          // stage filter
          if (selectedStage !== '') {
                rows = rows.filter(y => String(y.membership_stage) === selectedStage);
              }
   
          return rows;
    }, [youth, selectedSection, selectedStage]);

    // Sorting logic
    const sortedYouth = useMemo(() => {
        if (!sortConfig.key) return filteredYouth;
        const sorted = [...filteredYouth].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            // For dates, compare actual Date objects
            if (sortConfig.key === 'dob') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredYouth, sortConfig]);

    const requestSort = key => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = key => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    const handleDownload = () => {
        downloadCSV(
            sortedYouth,
            `youth_by_section_${selectedSection || 'all'}.csv`
        );
    };

    return (
        <div className="content-box">
            <PageTitle>
                <FolderKanban size={25} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Youth by Section Report
            </PageTitle>

            <div style={{ margin: '1rem 0' }}>
                <label style={{ marginRight: '0.5rem' }}>Select Section:</label>
                <select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                >
                    {sectionOptions.map(({ code, label }) => (
                        <option key={code} value={code}>
                            {label}
                        </option>
                    ))}
                </select>
				<span style={{ margin: '0 1rem' }}></span>
  <label>Select Stage:</label>
  <select
    value={selectedStage}
    onChange={e => setSelectedStage(e.target.value)}
    style={{ padding:'0.5rem', borderRadius:6, border:'1px solid #ccc' }}
  >
    {stageOptions.map(({ code,label }) => (
      <option key={code} value={code}>{label}</option>
    ))}
  </select>

            </div>


            <PrimaryButton onClick={handleDownload} style={{ marginBottom: '1rem' }}>
                Download CSV
            </PrimaryButton>

            {sortedYouth.length > 0 && (
                <StyledTable style={{ marginTop: '1rem', cursor: 'pointer' }}>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')}>Name{getSortIndicator('name')}</th>
                            <th onClick={() => requestSort('section')}>Section{getSortIndicator('section')}</th>
                            <th onClick={() => requestSort('membership_stage')}>Stage{getSortIndicator('membership_stage')}</th>
                            <th onClick={() => requestSort('dob')}>DOB{getSortIndicator('dob')}</th>
                            <th onClick={() => requestSort('patrol')}>Patrol{getSortIndicator('patrol')}</th>
                            <th onClick={() => requestSort('rank')}>Rank{getSortIndicator('rank')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedYouth.map(y => (
                            <tr key={y.id}>
                                <td>{y.name}</td>
                                <td>{codeToSectionLabel(y.section)}</td>
                                <td>{codeToStageLabel(y.membership_stage)}</td>
                                <td>{formatDate(y.dob)}</td>
                                <td>{y.patrol}</td>
                                <td>{y.rank}</td>
                            </tr>
                        ))}
                    </tbody>
                </StyledTable>
            )}
        </div>
    );
}
