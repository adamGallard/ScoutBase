import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCcw, Download, CalendarCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { sections, stages } from '@/components/common/Lookups.js';
const codeToLabel = code => sections.find(s => s.code === code)?.label ?? code;
import { getTodayDate } from '@/utils/dateUtils.js';  // ← import your date util
import AttendanceModal from "@/components/admin/reports/AttendanceEditModal";
// ...other imports

ChartJS.register(ArcElement, Tooltip, Legend); // ✅ move this outside the component
export default function AttendanceView({
    activeGroupId,
    selectedDate,
    sectionFilter,
    onDateChange,
    onSectionChange,
    userInfo
}) {
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [youthList, setYouthList] = useState([]);
    const [pieData, setPieData] = useState([]);

    const isScopedToSection = ['Section Leader', 'Section User'].includes(userInfo?.role);
    const [localSectionFilter, setLocalSectionFilter] = useState(userInfo?.section ?? '');

    const effectiveSectionFilter = isScopedToSection ? userInfo?.section : localSectionFilter;

    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);

    function handleEditAttendance(youth, signIn, signOut) {
        setModalData({ youth, signIn, signOut });
        setShowModal(true);
    }

    function handleAddAttendance() {
        setModalData({ youth: null, signIn: null, signOut: null });
        setShowModal(true);
    }

    function handleModalClose(saved) {
        setShowModal(false);
        setModalData(null);
        if (saved) fetchAttendance(); // reload data if something was saved
    }

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };


    const fetchYouthList = useCallback(async () => {
        if (!activeGroupId || !selectedDate) return;

        const { data, error } = await supabase
            .from('youth')
            .select('id, membership_stage, section, linking_section')
            .eq('group_id', activeGroupId);

        if (!error && data) {
            const filtered = data.filter(
                y =>
                    (!effectiveSectionFilter) ||
                    y.section === effectiveSectionFilter ||
                    y.linking_section === effectiveSectionFilter
            );
            setYouthList(filtered);
        }
    }, [activeGroupId, selectedDate, effectiveSectionFilter]);


    const fetchAttendance = useCallback(async () => {
        if (!activeGroupId) return;

        const { data, error } = await supabase
            .from('attendance')
            .select('*, youth (id, name, section, linking_section), parent:signed_by (id, name)')
            .eq('event_date', selectedDate)
            .eq('group_id', activeGroupId)
            .order('timestamp');

        if (error) return;

        const byYouth = {};
        data.forEach((entry) => {
            const id = entry.youth.id;
            if (!byYouth[id]) {
                byYouth[id] = {
                    youth: entry.youth,
                    signIn: null,
                    signOut: null,
                };
            }
            if (entry.action === 'signed in') byYouth[id].signIn = entry;
            if (entry.action === 'signed out') byYouth[id].signOut = entry;
        });


        const grouped = Object.values(byYouth);
        const filtered = effectiveSectionFilter
            ? grouped.filter(
                r =>
                    r.youth.section === effectiveSectionFilter ||
                    r.youth.linking_section === effectiveSectionFilter
            )
            : grouped;

        setFilteredAttendance(filtered);
    }, [activeGroupId, selectedDate, effectiveSectionFilter]);

    const sortedAttendance = useMemo(() => {
        if (!sortField) return filteredAttendance;

        return [...filteredAttendance].sort((a, b) => {
            const getValue = (obj, field) => {
                if (field === 'name') return obj.youth.name.toLowerCase();
                if (field === 'section') return obj.youth.section?.toLowerCase();
                if (field === 'signIn') return obj.signIn?.timestamp || '';
                if (field === 'signOut') return obj.signOut?.timestamp || '';
                return '';
            };

            const aVal = getValue(a, sortField);
            const bVal = getValue(b, sortField);

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredAttendance, sortField, sortDirection]);

    // on mount & whenever group/date/section change:
    useEffect(() => {
        // 1) if we don't have a date yet, default to today
        if (!selectedDate) {
            onDateChange(getTodayDate());
            return;     // wait for the new date before fetching
        }


        // 2) once we have both a group and a date, fetch everything
        if (activeGroupId) {
            fetchYouthList();
            fetchAttendance();
        }
    }, [
        activeGroupId,
        selectedDate,
        effectiveSectionFilter,
        fetchYouthList,
        fetchAttendance,
        onDateChange
    ]);


    useEffect(() => {
        if (!youthList.length) return;

        // ⚠️ Reset chart if nobody’s signed in — but keep lookup colors
        if (!filteredAttendance.length) {
            // 1. Count how many in each stage
            const totalsByStage = youthList.reduce((acc, y) => {
                acc[y.membership_stage] = (acc[y.membership_stage] || 0) + 1;
                return acc;
            }, {});

            // 2. Build pieData from your stages lookup (pulling in colors)
            const pie = stages.map(({ code, label, color }) => ({
                code,
                name: label,
                value: 0,                                   // nobody attended
                total: totalsByStage[code] || 0,           // expected count
                color
            }));

            // 3. Add “Not Signed In” slice if there are any expected
            const totalExpected = pie.reduce((sum, s) => sum + s.total, 0);
            if (totalExpected > 0) {
                pie.push({
                    code: 'not_signed_in',
                    name: 'Not Signed In',
                    value: totalExpected,
                    total: totalExpected,
                    color: '#d1d5db'
                });
            }

            setPieData(pie);
            return;
        }

        // 🧮 Build pie data from membershipStages lookup
        const signedInIds = filteredAttendance
            .filter(r => r.signIn)
            .map(r => r.youth.id);

        // Initialize a summary object keyed by stage.code
        const stageSummary = stages.reduce((acc, { code }) => {
            acc[code] = { total: 0, attended: 0 };
            return acc;
        }, {});

        // Tally totals & attended counts
        youthList.forEach(y => {
            const stage = y.membership_stage;
            if (stageSummary[stage]) {
                stageSummary[stage].total++;
                if (signedInIds.includes(y.id)) {
                    stageSummary[stage].attended++;
                }
            }
        });

        // Map into pie objects (including color from lookup)
        const pie = stages.map(({ code, label, color }) => ({
            code,
            name: label,
            value: stageSummary[code].attended,
            total: stageSummary[code].total,
            color
        }));

        // Add "Not Signed In" slice if needed
        const totalExpected = pie.reduce((sum, s) => sum + s.total, 0);
        const totalSignedIn = pie.reduce((sum, s) => sum + s.value, 0);
        if (totalExpected > totalSignedIn) {
            pie.push({
                code: 'not_signed_in',
                name: 'Not Signed In',
                value: totalExpected - totalSignedIn,
                total: totalExpected,
                color: '#d1d5db'
            });
        }

        setPieData(pie);
    }, [filteredAttendance, youthList, selectedDate]);

    const exportCSV = () => {
        const rows = [
            ['Name', 'Section', 'Sign In Time', 'Signed In By', 'Sign Out Time', 'Signed Out By'],
            ...filteredAttendance.map(({ youth, signIn, signOut }) => [
                youth.name,
                youth.section,
                signIn ? new Date(signIn.timestamp).toLocaleString() : '',
                signIn?.parent?.name || '',
                signOut ? new Date(signOut.timestamp).toLocaleString() : '',
                signOut?.parent?.name || ''
            ])
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `attendance_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalSignedIn = filteredAttendance.filter(r => r.signIn).length;
    const totalSignedOut = filteredAttendance.filter(r => r.signOut).length;
    useEffect(() => {

    }, [selectedDate, youthList, filteredAttendance, pieData]);

    return (
        <div className="content-box">
            <PageTitle>
                <CalendarCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Attendance Records
            </PageTitle>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                {!isScopedToSection && (
                    <label>
                        Section:{' '}
                        <select
                            value={localSectionFilter}
                            onChange={e => setLocalSectionFilter(e.target.value)}
                        >
                            <option value="">All</option>
                            {sections
                                .sort((a, b) => a.order - b.order)
                                .map(({ code, label }) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))
                            }
                        </select>
                    </label>
                )}

                <label>
                    Date:{' '}
                    <input
                        type="date"
                        className="date-picker"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                    />
                </label>

                <button onClick={fetchAttendance} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <RefreshCcw size={20} color="#0F5BA4" />
                </button>

                <button onClick={exportCSV} title="Export to CSV" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Download size={20} color="#0F5BA4" />
                </button>
            </div>

            {pieData.length > 0 && (
                <div style={{ maxWidth: '250px', margin: '1rem auto' }}>
                    <Doughnut
                        data={{
                            labels: pieData.map(d => d.name),
                            datasets: [{
                                data: pieData.map(d => d.value),
                                backgroundColor: pieData.map(d => d.color),
                                borderWidth: 1
                            }]
                        }}
                        options={{
                            cutout: '70%',
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        boxWidth: 12
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            const total = pieData[context.dataIndex]?.total;
                                            const value = context.formattedValue;
                                            return `${context.label}: ${value}/${total}`;
                                        }
                                    }
                                }
                            }
                        }}
                    />
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        {totalSignedIn} / {youthList.length} Present
                    </div>
                </div>
            )}

            <div className="table-container">
                <AdminTable>
                    <thead>
                        <tr>
                            {[
                                { field: 'name', label: 'Name' },
                                { field: 'section', label: 'Section' },
                                { field: 'signIn', label: 'Signed In' },
                                { field: 'signInComment', label: 'Sign in Comments' },
                                { field: 'signOut', label: 'Signed Out' },
                                { field: 'signOutComment', label: 'Sign out Comments' }
                            ].map(({ field, label }) => (
                                <th key={field} onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
                                    {label}
                                    {sortField === field &&
                                        (sortDirection === 'asc'
                                            ? <ChevronUp size={16} style={{ marginLeft: '4px' }} />
                                            : <ChevronDown size={16} style={{ marginLeft: '4px' }} />)}
                                </th>

                            ))}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAttendance.map(({ youth, signIn, signOut }) => (
                            <tr key={youth.id}>
                                <td>{youth.name}</td>
                                <td>{codeToLabel(youth.section)}</td>
                                <td>{signIn ? `${new Date(signIn.timestamp).toLocaleTimeString()} by ${signIn.parent?.name || 'Unknown'}` : '-'}</td>
                                <td>{signIn?.comment || ''}</td>
                                <td>{signOut ? `${new Date(signOut.timestamp).toLocaleTimeString()} by ${signOut.parent?.name || 'Unknown'}` : '-'}</td>
                                <td>{signOut?.comment || ''}</td>
                                <td>
                                    <button onClick={() => handleEditAttendance(youth, signIn, signOut)}>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td colSpan="2">Totals</td>
                            <td>{totalSignedIn} signed in</td>
                            <td></td>
                            <td>{totalSignedOut} signed out</td>
                            <td></td>
                            <td>
                                <button onClick={handleAddAttendance}>
                                    Add Attendance
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </AdminTable>
            </div>
            {showModal && (
                <AttendanceModal
                    open={showModal}
                    data={modalData}
                    groupId={activeGroupId}
                    date={selectedDate}
                    leaderName={userInfo?.name}
                    sectionFilter={effectiveSectionFilter}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}
