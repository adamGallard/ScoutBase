import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCcw, Download, CalendarCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminTable, PageTitle } from '@/components/common/SharedStyles';

function toProperCase(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
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
    const [adultRoles, setAdultRoles] = useState([]);
    const uniqueRoleGroups = [
        ...new Set(adultRoles.map(r => r.role_group).filter(Boolean))
    ];

    // Fetch adult roles from Supabase
    useEffect(() => {
        supabase
            .from('adult_roles')
            .select('*')
            .then(({ data, error }) => {
                if (!error) setAdultRoles(data || []);
            });
    }, []);

    // Helper for label
    const codeToRole = code => adultRoles.find(r => r.code === code);

    // Fetch attendance records for selected date
    useEffect(() => {
        if (!activeGroupId || !selectedDate) return;
        supabase
            .from('helper_attendance')
            .select(`
                *,
                parent:parent_id(id, name, role_code),
                signer:signed_by(id, name)
                adult_role:parent_id(role_code)
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

        // Apply filters (from role and section on role)
        return Object.values(byParent)
            .filter(row => {
                const role = codeToRole(row.parent.role_code);
                const roleSection = role?.section || '';
                const matchesSection = !sectionFilter || roleSection === sectionFilter;
                const matchesRole = !roleFilter || codeToRole(row.parent.role_code)?.role_group === roleFilter;
                return matchesSection && matchesRole;
            });
    }, [attendance, sectionFilter, roleFilter, adultRoles]);

    // Sorting (by name, role label, or section label)
    const sorted = useMemo(() => {
        if (!sortField) return rows;
        return [...rows].sort((a, b) => {
            const aRole = codeToRole(a.parent.role_code);
            const bRole = codeToRole(b.parent.role_code);
            const aVal =
                sortField === 'name'
                    ? (a.parent.name || '').toLowerCase()
                    : sortField === 'role'
                        ? (aRole?.label || '')
                        : sortField === 'section'
                            ? (aRole?.section || '')
                            : '';
            const bVal =
                sortField === 'name'
                    ? (b.parent.name || '').toLowerCase()
                    : sortField === 'role'
                        ? (bRole?.label || '')
                        : sortField === 'section'
                            ? (bRole?.section || '')
                            : '';
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortField, sortDirection, adultRoles]);

    const handleSort = field => {
        if (sortField === field) {
            setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // For filter dropdown: sections from adultRoles, deduplicated and propercased
    const uniqueSections = [
        ...new Set(adultRoles.map(r => r.section).filter(Boolean))
    ];

    const exportCSV = () => {
        const dataRows = [
            ['Name', 'Role', 'Section', 'Sign In Time', 'Signed In By', 'Sign In Comment', 'Sign Out Time', 'Signed Out By', 'Sign Out Comment'],
            ...sorted.map(row => {
                const role = codeToRole(row.parent.role_code);
                return [
                    row.parent.name,
                    toProperCase(role?.label),
                    toProperCase(role?.section),
                    row.signIn ? new Date(row.signIn.timestamp).toLocaleString() : '',
                    row.signIn?.signer?.name || '',
                    row.signIn?.comment || '',
                    row.signOut ? new Date(row.signOut.timestamp).toLocaleString() : '',
                    row.signOut?.signer?.name || '',
                    row.signOut?.comment || ''
                ];
            })
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
                        {uniqueSections.map(section => (
                            <option key={section} value={section}>{toProperCase(section)}</option>
                        ))}
                    </select>
                </label>
<label>
    Role:{' '}
    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
        <option value="">All</option>
        {uniqueRoleGroups.map(group => (
            <option key={group} value={group}>{toProperCase(group)}</option>
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
                        {sorted.map(row => {
                            const role = codeToRole(row.parent.role_code);
                            return (
                                <tr key={row.parent.id}>
                                    <td>{row.parent.name}</td>
                                    <td>{toProperCase(role?.title || row.parent.role_code || '')}</td>
                                    <td>{toProperCase(role?.section)}</td>
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
                            );
                        })}
                    </tbody>
                </AdminTable>
            </div>
        </div>
    );
}
