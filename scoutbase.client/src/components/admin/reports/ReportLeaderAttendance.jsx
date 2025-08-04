import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCcw, Download, CalendarCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';
import { sections } from '@/components/common/Lookups.js';
import { getTodayDate } from '@/utils/dateUtils.js';

const codeToLabel = code => sections.find(s => s.code === code)?.label ?? (code || '—');

const ADULT_ROLES = [
    { code: 'leader', label: 'Leader' },
    { code: 'parent_helper', label: 'Parent Helper' },
    { code: 'committee', label: 'Committee' },
    { code: 'parent', label: 'Parent (Unassigned)' }
];

function formatTimeWithDate(timestamp, eventDate) {
    if (!timestamp) return '';
    const dt = new Date(timestamp);
    const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tsDate = dt.toISOString().slice(0, 10);
    if (!eventDate || tsDate === eventDate) {
        return timeStr;
    }
    return `${dt.toLocaleDateString()} ${timeStr}`;
}

export default function ReportHelperAttendance({
    activeGroupId,
    selectedDate,
    sectionFilter: parentSectionFilter,
    onDateChange,
    onSectionChange,
    userInfo
}) {
    const [attendance, setAttendance] = useState([]);
    const [sectionFilter, setSectionFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Fetch attendance records for selected date
    useEffect(() => {
        if (!activeGroupId || !selectedDate) return;
        supabase
            .from('helper_attendance')
            .select(`
                *,
                parent:parent_id(id, name, role),
                signer:signed_by(id, name)
            `)
            .eq('group_id', activeGroupId)
            .eq('event_date', selectedDate)
            .order('timestamp')
            .then(({ data, error }) => {
                if (!error) setAttendance(data || []);
            });
    }, [activeGroupId, selectedDate]);

    // Combine records for same adult (group by parent_id)
    const rows = useMemo(() => {
        // Only include attendance records that have a parent (adult)
        const present = attendance.filter(r => r.parent);

        // Group by parent_id
        const byParent = {};
        present.forEach(entry => {
            const id = entry.parent.id;
            if (!byParent[id]) {
                byParent[id] = {
                    parent: entry.parent,
                    signIn: null,
                    signOut: null
                };
            }
            if (entry.action === 'signed in') byParent[id].signIn = entry;
            if (entry.action === 'signed out') byParent[id].signOut = entry;
        });

        // Apply filters
        return Object.values(byParent)
            .filter(row => {
                const matchesSection = !sectionFilter || row.parent.section === sectionFilter;
                const matchesRole = !roleFilter || row.parent.role === roleFilter;
                return matchesSection && matchesRole;
            });
    }, [attendance, sectionFilter, roleFilter]);

    // Sorting
    const sorted = useMemo(() => {
        if (!sortField) return rows;
        return [...rows].sort((a, b) => {
            const aVal =
                sortField === 'name'
                    ? (a.parent.name || '').toLowerCase()
                    : sortField === 'role'
                        ? (a.parent.role || '')
                        : sortField === 'section'
                            ? (a.parent.section || '')
                            : '';
            const bVal =
                sortField === 'name'
                    ? (b.parent.name || '').toLowerCase()
                    : sortField === 'role'
                        ? (b.parent.role || '')
                        : sortField === 'section'
                            ? (b.parent.section || '')
                            : '';
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortField, sortDirection]);

    const handleSort = field => {
        if (sortField === field) {
            setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const exportCSV = () => {
        const dataRows = [
            ['Name', 'Role', 'Section', 'Sign In Time', 'Signed In By', 'Sign In Comment', 'Sign Out Time', 'Signed Out By', 'Sign Out Comment'],
            ...sorted.map(row => [
                row.parent.name,
                ADULT_ROLES.find(r => r.code === row.parent.role)?.label ?? row.parent.role,
                codeToLabel(row.parent.section),
                row.signIn ? new Date(row.signIn.timestamp).toLocaleString() : '',
                row.signIn?.signer?.name || '',
                row.signIn?.comment || '',
                row.signOut ? new Date(row.signOut.timestamp).toLocaleString() : '',
                row.signOut?.signer?.name || '',
                row.signOut?.comment || ''
            ])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + dataRows.map(e => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `helper_attendance_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="content-box">
            <PageTitle>
                <CalendarCheck size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Adult Attendance Records
            </PageTitle>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <label>
                    Section:{' '}
                    <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                        <option value="">All</option>
                        {sections.map(({ code, label }) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                        <option value="group">Group</option>
                    </select>
                </label>
                <label>
                    Role:{' '}
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">All</option>
                        {ADULT_ROLES.map(({ code, label }) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Date:{' '}
                    <input
                        type="date"
                        className="date-picker"
                        value={selectedDate}
                        onChange={e => onDateChange(e.target.value)}
                    />
                </label>
                <button onClick={() => window.location.reload()} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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
                            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                                Name {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                            </th>
                            <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                                Role {sortField === 'role' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                            </th>
                            <th onClick={() => handleSort('section')} style={{ cursor: 'pointer' }}>
                                Section {sortField === 'section' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                            </th>
                            <th>Sign In</th>
                            <th>Signed In By</th>
                            <th>Sign In Comment</th>
                            <th>Sign Out</th>
                            <th>Signed Out By</th>
                            <th>Sign Out Comment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(row => (
                            <tr key={row.parent.id}>
                                <td>{row.parent.name}</td>
                                <td>{ADULT_ROLES.find(r => r.code === row.parent.role)?.label ?? row.parent.role}</td>
                                <td>{codeToLabel(row.parent.section)}</td>
                                <td>
                                    {row.signIn
                                        ? formatTimeWithDate(row.signIn.timestamp, selectedDate)
                                        : '-'}
                                </td>
                                <td>{row.signIn?.signer?.name || ''}</td>
                                <td>{row.signIn?.comment || ''}</td>
                                <td>
                                    {row.signOut
                                        ? formatTimeWithDate(row.signOut.timestamp, selectedDate)
                                        : '-'}
                                </td>
                                <td>{row.signOut?.signer?.name || ''}</td>
                                <td>{row.signOut?.comment || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            </div>
        </div>
    );
}
