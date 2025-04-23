import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton, PageTitle, Select, AdminTable } from '@/components/common/SharedStyles';
import { getAgeWithMonths, getLinkingStatus, getLinkingThreshold } from '@/utils/dateUtils';
import { Cake, ChevronUp, ChevronDown } from 'lucide-react';

const SECTIONS = ['Joeys', 'Cubs', 'Scouts', 'Venturers'];

export default function ReportAge({ groupId }) {
    const [rows, setRows] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [linkingFilter, setLinkingFilter] = useState('');
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };


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
                const shouldLink = getLinkingStatus(youth.dob, youth.section, youth.membership_stage);
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
        let result = rows.filter(r =>
                (!sectionFilter || r.section === sectionFilter) &&
                (!statusFilter || r.membership_stage === statusFilter) &&
                (statusFilter || r.membership_stage !== 'Retired') &&// Exclude Retired unless explicitly selected
                (!linkingFilter || r.shouldLink === linkingFilter)
        );
        if (sortField) {
            result.sort((a, b) => {
                const aValue = a[sortField]?.toString().toLowerCase() ?? '';
                const bValue = b[sortField]?.toString().toLowerCase() ?? '';
                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFiltered(result);
    }, [rows, sectionFilter, statusFilter, linkingFilter, sortField, sortDirection]);



    return (
        <div className="content-box">
            <PageTitle>
                <Cake size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Youth Age Report
            </PageTitle>

            <p>This report highlights youth approaching or past their expected linking age.</p>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    <option value="">All Sections</option>
                    {SECTIONS.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                    ))}
                </Select>

                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Stages</option>
                    <option value="Have a Go">Have a Go</option>
                    <option value="Linking">Linking</option>
                    <option value="Invested">Invested</option>
                    <option value="Retired">Retired</option>
                </Select>
                <Select
                    value={linkingFilter}
                    onChange={(e) => setLinkingFilter(e.target.value)}
                >
                    <option value="">All Actions</option>
                    <option value="Approaching">Approaching</option>
                    <option value="Overdue">Overdue</option>
                </Select>
                <PrimaryButton onClick={() => downloadCSV(filtered, 'age_report')}>
                    Download CSV
                </PrimaryButton>
            </div>

            {loading && <p>Loading...</p>}
            {!loading && filtered.length === 0 && <p>No youth found.</p>}

            {!loading && filtered.length > 0 && (
                <AdminTable>
                    <thead>
                        <tr>
                            {['name', 'dob', 'age', 'section', 'membership_stage', 'shouldLink'].map((field) => (
                                <th key={field} onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
                                    {field === 'shouldLink' ? 'Action Needed' : field.charAt(0).toUpperCase() + field.slice(1)}
                                    {sortField === field && (sortDirection === 'asc' ? (<ChevronUp size={16} strokeWidth={2} />
                                    ) : (
                                        <ChevronDown size={16} strokeWidth={2} />
                                    ))
                                    }
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {filtered.map((youth) => (
                            <tr
                                key={youth.name}
                                style={{
                                    backgroundColor:
                                        youth.shouldLink === 'Overdue'
                                            ? '#ffe4e1' // light red for overdue
                                            : youth.shouldLink === 'Approaching'
                                                ? '#fff8dc' // light yellow for approaching
                                                : 'transparent'
                                }}
                            >
                                <td>{youth.name}</td>
                                <td>{youth.dob}</td>
                                <td>{youth.age}</td>
                                <td>{youth.section}</td>
                                <td>{youth.membership_stage}</td>
                                <td>{youth.shouldLink || ''} </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </div>
    );
}
