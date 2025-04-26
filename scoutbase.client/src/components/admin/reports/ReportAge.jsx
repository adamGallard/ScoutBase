// src/components/admin/ReportAge.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { downloadCSV } from '@/utils/exportUtils';
import { PrimaryButton, PageTitle, Select, AdminTable } from '@/components/common/SharedStyles';
import { getAgeWithMonths, getLinkingStatus } from '@/utils/dateUtils';
import { Cake, ChevronUp, ChevronDown } from 'lucide-react';
import { sections, sectionMap, stages, stageMap } from '@/components/common/Lookups';

export default function ReportAge({ groupId }) {
    const [rows, setRows] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [linkingFilter, setLinkingFilter] = useState('');
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(false);

    // Code for the "Retired" stage, so we can exclude it by default
    const retiredCode = stages.find(s => s.code === 'retired')?.code;

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Fetch youth data once
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

            const enriched = (data || []).map(youth => ({
                ...youth,
                age: getAgeWithMonths(youth.dob),
                shouldLink: getLinkingStatus(
                    youth.dob,
                    youth.section,
                    youth.membership_stage
                )
            }));

            setRows(enriched);
            setLoading(false);
        };

        if (groupId) {
            fetchData();
        }
    }, [groupId]);

    // Filter & sort whenever inputs change
    useEffect(() => {
        let result = rows.filter(r =>
            (!sectionFilter || r.section === sectionFilter) &&
            (!statusFilter || r.membership_stage === statusFilter) &&
            (statusFilter || r.membership_stage !== retiredCode) &&  // exclude retired by default
            (!linkingFilter || r.shouldLink === linkingFilter)
        );

        if (sortField) {
            result.sort((a, b) => {
                const aVal = (a[sortField] ?? '').toString().toLowerCase();
                const bVal = (b[sortField] ?? '').toString().toLowerCase();
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFiltered(result);
    }, [
        rows,
        sectionFilter,
        statusFilter,
        linkingFilter,
        sortField,
        sortDirection,
        retiredCode
    ]);

    return (
        <div className="content-box">
            <PageTitle>
                <Cake size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Youth Age Report
            </PageTitle>

            <p>This report highlights youth approaching or past their expected linking age.</p>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <Select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                    <option value="">All Sections</option>
                    {sections.map(s => (
                        <option key={s.code} value={s.code}>
                            {s.label}
                        </option>
                    ))}
                </Select>

                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Stages</option>
                    {stages.map(s => (
                        <option key={s.code} value={s.code}>
                            {s.label}
                        </option>
                    ))}
                </Select>

                <Select value={linkingFilter} onChange={e => setLinkingFilter(e.target.value)}>
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
                            {[
                                { field: 'name', label: 'Name' },
                                { field: 'dob', label: 'DOB' },
                                { field: 'age', label: 'Age' },
                                { field: 'section', label: 'Section' },
                                { field: 'membership_stage', label: 'Stage' },
                                { field: 'shouldLink', label: 'Action Needed' }
                            ].map(({ field, label }) => (
                                <th
                                    key={field}
                                    onClick={() => handleSort(field)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {label}
                                    {sortField === field && (
                                        sortDirection === 'asc'
                                            ? <ChevronUp size={16} strokeWidth={2} />
                                            : <ChevronDown size={16} strokeWidth={2} />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {filtered.map(youth => (
                            <tr
                                key={youth.name + youth.dob}
                                style={{
                                    backgroundColor:
                                        youth.shouldLink === 'Overdue'
                                            ? '#ffe4e1'
                                            : youth.shouldLink === 'Approaching'
                                                ? '#fff8dc'
                                                : 'transparent'
                                }}
                            >
                                <td>{youth.name}</td>
                                <td>{youth.dob}</td>
                                <td>{youth.age}</td>
                                <td>{sectionMap[youth.section]?.label || youth.section}</td>
                                <td>{stageMap[youth.membership_stage]?.label || youth.membership_stage}</td>
                                <td>{youth.shouldLink || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </div>
    );
}
