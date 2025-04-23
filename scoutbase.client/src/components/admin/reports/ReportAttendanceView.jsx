import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCcw, Download, CalendarCheck } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';


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
    const [localSectionFilter, setLocalSectionFilter] = useState(userInfo?.section || '');

    const effectiveSectionFilter = isScopedToSection ? userInfo?.section : localSectionFilter;

    const fetchYouthList = useCallback(async () => {
        if (!activeGroupId || !selectedDate) return;

        const { data, error } = await supabase
            .from('youth')
            .select('id, membership_stage, section, linking_section')
            .eq('group_id', activeGroupId);

        if (!error && data) {
            const filtered = data.filter(
                y => y.section === effectiveSectionFilter || y.linking_section === effectiveSectionFilter
            );
            setYouthList(filtered);
        }
    }, [activeGroupId, selectedDate, effectiveSectionFilter]);

    useEffect(() => {
        fetchYouthList();
    }, [fetchYouthList, selectedDate]);

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
            ? grouped.filter((r) => r.youth.section === effectiveSectionFilter)
            : grouped;

        setFilteredAttendance(filtered);
    }, [activeGroupId, selectedDate, effectiveSectionFilter]);
 
    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance, selectedDate]);

    useEffect(() => {
        if (!youthList.length) return;

        // ⚠️ Reset chart if attendance is empty
        if (!filteredAttendance.length) {
            const stageSummary = {
                Invested: 0,
                'Have a Go': 0,
                Linking: 0,
            };

            youthList.forEach((y) => {
                const stage = y.membership_stage;
                if (stage in stageSummary) {
                    stageSummary[stage]++;
                }
            });

            const pie = Object.entries(stageSummary).map(([stage, total]) => ({
                name: stage,
                value: 0,
                total
            }));

            if (youthList.length > 0) {
                pie.push({
                    name: "Not Signed In",
                    value: youthList.length,
                    total: youthList.length
                });
            }

            setPieData(pie);
            return;
        }

        // 🧮 Standard pie data logic
        const signedInIds = filteredAttendance
            .filter(r => r.signIn)
            .map(r => r.youth.id);

        const stageSummary = {
            Invested: { total: 0, attended: 0 },
            'Have a Go': { total: 0, attended: 0 },
            Linking: { total: 0, attended: 0 },
        };

        youthList.forEach((y) => {
            const stage = y.membership_stage;
            if (stageSummary[stage]) {
                stageSummary[stage].total++;
                if (signedInIds.includes(y.id)) {
                    stageSummary[stage].attended++;
                }
            }
        });

        let totalSignedIn = 0;
        const pie = [];

        Object.entries(stageSummary).forEach(([stage, { total, attended }]) => {
            totalSignedIn += attended;
            pie.push({
                name: stage,
                value: attended,
                total,
            });
        });

        const totalExpected = Object.values(stageSummary).reduce((sum, { total }) => sum + total, 0);
        const notSignedIn = totalExpected - totalSignedIn;

        if (notSignedIn > 0) {
            pie.push({
                name: 'Not Signed In',
                value: notSignedIn,
                total: totalExpected
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
        console.log("📅 Date changed:", selectedDate);
        console.log("👥 Youth List:", youthList);
        console.log("✅ Filtered Attendance:", filteredAttendance);
        console.log("📊 Pie Data:", pieData);
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
                        <select value={localSectionFilter} onChange={(e) => setLocalSectionFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="Joeys">Joeys</option>
                            <option value="Cubs">Cubs</option>
                            <option value="Scouts">Scouts</option>
                            <option value="Venturers">Venturers</option>
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
                                backgroundColor: pieData.map(d =>
                                    d.name === 'Not Signed In' ? '#d1d5db' : (
                                        d.name === 'Have a Go' ? '#FACC15' :
                                            d.name === 'Linking' ? '#38BDF8' :
                                                '#0F5BA4'
                                    )
                                ),
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
                            <th>Name</th>
                            <th>Section</th>
                            <th>Signed In</th>
                            <th>Comments</th>
                            <th>Signed Out</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(({ youth, signIn, signOut }) => {

                            return (
                                <tr key={youth.id}>
                                    <td>{youth.name}</td>
                                    <td>{youth.section}</td>
                                    <td>{signIn ? `${new Date(signIn.timestamp).toLocaleTimeString()} by ${signIn.parent?.name || 'Unknown'}` : '-'}</td>
                                    <td>{signIn?.comment || ''}</td>
                                    <td>{signOut ? `${new Date(signOut.timestamp).toLocaleTimeString()} by ${signOut.parent?.name || 'Unknown'}` : '-'}</td>
                                    <td>{signOut?.comment || ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td colSpan="2">Totals</td>
                            <td>{totalSignedIn} signed in</td>
                            <td></td>
                            <td>{totalSignedOut} signed out</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </AdminTable>
            </div>
        </div>
    );
}
