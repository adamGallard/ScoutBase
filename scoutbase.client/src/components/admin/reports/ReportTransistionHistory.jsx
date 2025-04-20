import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle, PrimaryButton, AdminTable } from '@/components/common/SharedStyles';
import { Download, Users } from 'lucide-react';
import { logAuditEvent } from '@/helpers/auditHelper';

export default function TransitionHistoryReport({ groupid, userInfo }) {
    const [transitions, setTransitions] = useState([]);
    const [youthMap, setYouthMap] = useState({});
    const [loading, setLoading] = useState(true);

	console.log('TransitionHistoryReport', { groupid, userInfo });

    const scopedSection = ['Section Leader', 'Section User'].includes(userInfo.role)
        ? userInfo.section
        : null;

    useEffect(() => {
        const fetchData = async () => {
            const { data: youthData } = await supabase
                .from('youth')
                .select('id, name, section')
                .eq('group_id', groupid);

            const youthFiltered = scopedSection
                ? youthData.filter(y => y.section === scopedSection)
                : youthData;

            const youthMapTemp = youthFiltered.reduce((acc, y) => {
                acc[y.id] = y;
                return acc;
            }, {});

            const { data: transitionsData } = await supabase
                .from('youth_transitions')
                .select('*')
                .eq('group_id', groupid);

            const filteredTransitions = transitionsData.filter(t => t.youth_id in youthMapTemp);

            setYouthMap(youthMapTemp);
            setTransitions(filteredTransitions);
            setLoading(false);
        };

        fetchData();
    }, [userInfo]);

    const exportCSV = async () => {
        const rows = [
            ['Name', 'Current Section', 'Transition Type', 'Transition Section', 'Date', 'Notes'],
            ...transitions.map((t) => [
                youthMap[t.youth_id]?.name || 'Unknown',
                youthMap[t.youth_id]?.section || 'Unknown',
                t.transition_type,
                t.section,
                new Date(t.created_at).toLocaleDateString(),
                t.notes || ''
            ])
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `transition_history.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await logAuditEvent({
            groupId: groupid,
            role: userInfo.role,
            action: 'report_export',
            targetType: 'transition_history',
            targetId: null
        });
    };

    return (
        <div className="content-box">
            <PageTitle>
                <Users size={25} style={{ marginRight: '0.5rem' }} />
                Transition History
            </PageTitle>

            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <PrimaryButton onClick={exportCSV}>
                    <Download size={16} style={{ marginRight: '0.5rem' }} />
                    Export CSV
                </PrimaryButton>
            </div>

            {loading ? <p>Loading...</p> : (
                <AdminTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Current Section</th>
                            <th>Transition Type</th>
                            <th>Transition Section</th>
                            <th>Date</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transitions.map(t => (
                            <tr key={t.id}>
                                <td>{youthMap[t.youth_id]?.name || 'Unknown'}</td>
                                <td>{youthMap[t.youth_id]?.section || 'Unknown'}</td>
                                <td>{t.transition_type}</td>
                                <td>{t.section}</td>
                                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                                <td>{t.notes || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </div>
    );
}
