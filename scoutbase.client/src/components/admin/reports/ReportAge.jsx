import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton,PageTitle } from '@/components/common/SharedStyles';
import { getAgeWithMonths, getLinkingStatus, getLinkingThreshold } from '@/utils/dateUtils';
import { Cake } from 'lucide-react';
export default function ReportAge({ groupId }) {
    const [rows, setRows] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('youth')
                .select('name, dob, section, membership_stage')
                .eq('group_id', groupId);

            if (error) {
                console.error('❌ Error loading youth:', error.message);
                setLoading(false);
                return;
            }

            const enriched = (data || []).map(youth => {
                const age = getAgeWithMonths(youth.dob);
                const shouldLink = getLinkingStatus(youth.dob, youth.section)
                return {
                    ...youth,
                    age,
                    shouldLink
                };
            });

            setRows(enriched);
            setLoading(false);
        };

        fetchData();
    }, [groupId]);

    useEffect(() => {
        setFiltered(
            rows.filter(r =>
                (!sectionFilter || r.section === sectionFilter) &&
                (!statusFilter || r.membership_stage === statusFilter)
            )
        );
    }, [rows, sectionFilter, statusFilter]);

    return (
        <div className="content-box">
            <PageTitle>
                <Cake size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Youth Age Report</PageTitle>
            <p>This report highlights youth approaching or past their expected linking age.</p>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    <option value="">All Sections</option>
                    {Object.keys(getLinkingThreshold).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Stages</option>
                    <option value="Have a Go">Have a Go</option>
                    <option value="Linking">Linking</option>
                    <option value="Invested">Invested</option>
                    <option value="Retired">Retired</option>
                </select>

                <PrimaryButton onClick={() => downloadCSV(filtered, 'age_report')}>
                    Download CSV
                </PrimaryButton>
            </div>

            {loading && <p>Loading...</p>}
            {!loading && filtered.length === 0 && <p>No youth found.</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>DOB</th>
                        <th>Age</th>
                        <th>Section</th>
                        <th>Status</th>
                        <th>Action Needed</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(youth => (
                        <tr key={youth.name} style={{
                            backgroundColor: youth.shouldLink ? '#ffe4e1' : 'transparent'
                        }}>
                            <td>{youth.name}</td>
                            <td>{youth.dob}</td>
                            <td>{youth.age}</td>
                            <td>{youth.section}</td>
                            <td>{youth.membership_stage}</td>
                            <td>{youth.shouldLink ? 'Linking overdue' : ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
