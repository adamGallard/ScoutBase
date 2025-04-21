// src/components/admin/reports/TransitionHistoryReport.jsx

import { useEffect, useState } from 'react';
import { fetchTransitionHistory } from '@/helpers/reportHelper';
import { logAuditEvent } from '@/helpers/auditHelper';
import { exportToCSV } from '@/utils/csvUtils';
import { PageWrapper, PrimaryButton, FilterRow, PageTitle } from '@/components/common/SharedStyles';
import { hasSectionAccess } from '@/utils/roleUtils';
import { Repeat } from 'lucide-react';

export default function TransitionHistoryReport({ groupId, userInfo }) {
    const [data, setData] = useState([]);
    const [sectionFilter, setSectionFilter] = useState(userInfo?.section || '');

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

    return (
        <PageWrapper>
            <PageTitle><Repeat size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} /> Linking History Report</PageTitle>
            <PrimaryButton onClick={handleDownload}>Download CSV</PrimaryButton>
            {hasSectionAccess(userInfo) && (
                <FilterRow>
                    <label>Section: </label>
                    <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="Joeys">Joeys</option>
                        <option value="Cubs">Cubs</option>
                        <option value="Scouts">Scouts</option>
                        <option value="Venturers">Venturers</option>
                    </select>
                </FilterRow>
            )}

            {Object.entries(data).length === 0 && <p>No data found.</p>}

            {Object.entries(data).map(([youth_name, transitions]) => (
                <div key={youth_name} style={{ marginBottom: '2rem' }}>
                    <h3>{youth_name}</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                    <td>{t.section}</td>
                                    <td>{t.transition_type}</td>
                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                    <td>{t.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            
        </PageWrapper>
    );
}
