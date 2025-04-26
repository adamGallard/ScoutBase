// src/components/admin/reports/TransitionHistoryReport.jsx

import { useEffect, useState } from 'react';
import { fetchTransitionHistory } from '@/helpers/reportHelper';
import { logAuditEvent } from '@/helpers/auditHelper';
import { exportToCSV } from '@/utils/csvUtils';
import { PageWrapper, PrimaryButton, FilterRow, PageTitle, StyledTable, Select } from '@/components/common/SharedStyles';
import { hasSectionAccess } from '@/utils/roleUtils';
import { Repeat } from 'lucide-react';
import { sections,stages } from '@/components/common/Lookups.js';
export default function TransitionHistoryReport({ groupId, userInfo }) {
    const [data, setData] = useState([]);
    const [sectionFilter, setSectionFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const canFilterBySection = userInfo?.role === 'Group Leader' || hasSectionAccess(userInfo);
    const codeToLabel = code =>
        sections.find(s => s.code === code)?.label ?? code;
    const StageToLabel = code =>
        stages.find(s => s.code === code)?.label ?? code;


    useEffect(() => {
        const fetchData = async () => {
            const transitions = await fetchTransitionHistory(groupId, sectionFilter, userInfo);
            const grouped = transitions.reduce((acc, t) => {
                const key = t.youth_name;
                if (!acc[key]) acc[key] = [];
                acc[key].push(t);
                return acc;
            }, {});
            setData(grouped);
        };

        if (groupId && userInfo) {
            fetchData();
        }
    }, [groupId, sectionFilter, userInfo]);

    const handleDownload = () => {
        // Flatten for export
        const flat = Object.entries(data).flatMap(([youth_name, transitions]) =>
            transitions.map(t => ({ ...t, youth_name }))
        );
        exportToCSV(flat, 'transition_history');
        logAuditEvent('Downloaded transition history report', userInfo.user_id);
    };
    const filteredEntries = Object.entries(data).filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
	);

    return (
        <PageWrapper>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <PageTitle>
                    <Repeat size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                    Linking History Report
                </PageTitle>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    {canFilterBySection && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label htmlFor="sectionSelect">Section:</label>
                            <Select
                                id="sectionSelect"
                                value={sectionFilter}
                                onChange={(e) => setSectionFilter(e.target.value)}
                                style={{ minWidth: '140px' }}
                            >
                                <option value="">All</option>
                                                               {sections
                                                                      .slice()
                                                                      .sort((a, b) => a.order - b.order)
                                                                      .map(({ code, label }) => (
                                                                            <option key={code} value={code}>
                                                                                  {label}
                                                                                </option>
                                                                          ))
                                                                    }
                            </Select>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Search name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            minWidth: '200px'
                        }}
                    />
                    <PrimaryButton onClick={handleDownload}>
                        Download CSV
                    </PrimaryButton>
                </div>
            </div>
            {filteredEntries.length === 0 && <p>No data found.</p>}


            {filteredEntries.map(([youth_name, transitions]) => (
                <div key={youth_name} style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{youth_name}</h3>
                    <StyledTable>
                        <colgroup>

                            <col style={{ width: '15%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '15%' }} />
                            <col style={{ width: '55%' }} />
                        </colgroup>
                        <thead>
                            <tr>

                                <th>Section</th>
                                <th>Transition Type</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transitions.map((t) => (
                                <tr key={t.id}>
                                    <td>{codeToLabel(t.section)}</td>
                                    <td>{StageToLabel(t.transition_type)}</td>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>{t.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </StyledTable>
                </div>
            ))}

            
        </PageWrapper>
    );
}
