import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { RefreshCcw, Download, CalendarCheck } from 'lucide-react';
import { AdminTable, PageTitle } from '../SharedStyles';

export default function AttendanceView({ activeGroupId, selectedDate, sectionFilter, onDateChange, onSectionChange }) {
    const [filteredAttendance, setFilteredAttendance] = useState([]);

    const fetchAttendance = useCallback(async () => {
        if (!activeGroupId) return;

        const { data, error } = await supabase
            .from('attendance')
            .select('*, youth (id, name, section)')
            .eq('event_date', selectedDate)
            .eq('group_id', activeGroupId)
            .order('timestamp');

        if (error) {
            console.error('Error loading attendance:', error);
            return;
        }

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
        const filtered = sectionFilter
            ? grouped.filter((r) => r.youth.section === sectionFilter)
            : grouped;

        setFilteredAttendance(filtered);
    }, [activeGroupId, selectedDate, sectionFilter]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const exportCSV = () => {
        const rows = [
            ['Name', 'Section', 'Sign In Time', 'Signed In By', 'Sign Out Time', 'Signed Out By'],
            ...filteredAttendance.map(({ youth, signIn, signOut }) => [
                youth.name,
                youth.section,
                signIn ? new Date(signIn.timestamp).toLocaleString() : '',
                signIn?.signed_by || '',
                signOut ? new Date(signOut.timestamp).toLocaleString() : '',
                signOut?.signed_by || ''
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

    return (
        <div className="content-box">
            <PageTitle>
                <CalendarCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Attendance Records
            </PageTitle>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <label>
                    Section:{' '}
                    <select value={sectionFilter} onChange={(e) => onSectionChange(e.target.value)}>
                        <option value="">All</option>
                        <option value="Joeys">Joeys</option>
                        <option value="Cubs">Cubs</option>
                        <option value="Scouts">Scouts</option>
                        <option value="Venturers">Venturers</option>
                    </select>
                </label>

                <label>
                    Date:{' '}
                    <input type="date" className="date-picker" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
                </label>

                <button onClick={fetchAttendance} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <RefreshCcw size={20} color="#0F5BA4" />
                </button>

                <button onClick={exportCSV} title="Export to CSV" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Download size={20} color="#0F5BA4" />
                </button>
            </div>

            <div className="table-container">
                <AdminTable>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Section</th>
                            <th>Signed In</th>
                            <th>Signed Out</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(({ youth, signIn, signOut }) => (
                            <tr key={youth.id}>
                                <td>{youth.name}</td>
                                <td>{youth.section}</td>
                                <td>{signIn ? `${new Date(signIn.timestamp).toLocaleTimeString()} by ${signIn.signed_by}` : '-'}</td>
                                <td>{signOut ? `${new Date(signOut.timestamp).toLocaleTimeString()} by ${signOut.signed_by}` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ fontWeight: 'bold' }}>
                            <td colSpan="2">Totals</td>
                            <td>{totalSignedIn} signed in</td>
                            <td>{totalSignedOut} signed out</td>
                        </tr>
                    </tfoot>
                </AdminTable>
            </div>
        </div>
    );
}
