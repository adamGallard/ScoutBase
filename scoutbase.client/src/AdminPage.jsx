import { useEffect, useState } from 'react';
import { FileText, UserPlus, Users, Link2, BarChart2, Menu, ArrowLeft, LogOut, Pencil, Check, X, Trash, Plus, RefreshCcw, Download } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import './App.css';
import { useNavigate } from 'react-router-dom';

function RequireAuth({ children }) {
    const navigate = useNavigate();
    useEffect(() => {
        const isAuthed = localStorage.getItem('scoutbase-admin-authed');
        if (!isAuthed) navigate('/admin-login');
    }, [navigate]);
    return children;
}

function Sidebar({ onNavigate }) {
    const [collapsed, setCollapsed] = useState(false);
    const navItems = [
        { key: 'attendance', label: 'Attendance', icon: <FileText size={16} /> },
        { key: 'add-parent', label: 'Parent', icon: <UserPlus size={16} /> },
        { key: 'add-youth', label: 'Youth', icon: <Users size={16} /> },
        { key: 'link', label: 'Link Parent/Youth', icon: <Link2 size={16} /> },
        { key: 'reports', label: 'Reports', icon: <BarChart2 size={16} /> },
    ];

    return (
        <div style={{
            width: collapsed ? '60px' : '200px',
            transition: 'width 0.3s ease',
            backgroundColor: '#f5f5f5',
            height: '100vh',
            padding: '1rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed ? 'center' : 'flex-start',
            borderRight: '1px solid #ddd'
        }}>
            <button onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar" style={btnStyle}>
                {collapsed ? <Menu size={16} /> : <ArrowLeft size={16} />}
            </button>
            <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
                {navItems.map((item) => (
                    <li key={item.key} style={{ width: '100%' }}>
                        <button onClick={() => onNavigate(item.key)} style={btnStyle}>
                            <span>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    </li>
                ))}
                <li style={{ marginTop: 'auto', width: '100%' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('scoutbase-admin-authed');
                            window.location.href = '/admin-login';
                        }}
                        style={{ ...btnStyle, color: '#b00' }}
                    >
                        {!collapsed ? <><LogOut size={16} style={{ marginRight: '8px' }} />Logout</> : <LogOut size={16} />}
                    </button>
                </li>
            </ul>
        </div>
    );
}

const btnStyle = {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    padding: '0.75rem 1rem',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#333',
    transition: 'background 0.2s',
};

export default function AdminPage() {
    const [view, setView] = useState('attendance');
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [filteredAttendance, setFilteredAttendance] = useState([]);
    const [parents, setParents] = useState([]);
    const [editingParentId, setEditingParentId] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

    const [youthList, setYouthList] = useState([]);
    const [youthForm, setYouthForm] = useState({ name: '', dob: '', section: '', membership_stage: '' });
    const [editingYouthId, setEditingYouthId] = useState(null);
    const [sectionFilter, setSectionFilter] = useState('');

    useEffect(() => {
        if (view === 'add-parent') fetchParents();
        if (view === 'add-youth') fetchYouth();
    }, [view]);

    useEffect(() => {
        if (view === 'attendance') {
            fetchAttendance();
        }
    }, [selectedDate, sectionFilter, view]);

    const fetchAttendance = async () => {
        const { data, error } = await supabase
            .from('attendance')
            .select('*, youth (id, name, section)')
            .eq('event_date', selectedDate)
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

        setAttendanceData(grouped);
        setFilteredAttendance(filtered);
    };

    const fetchParents = async () => {
        const { data } = await supabase.from('parent').select('*').order('name');
        if (data) setParents(data);
    };

    const fetchYouth = async () => {
        const { data } = await supabase
            .from('youth')
            .select('id, name, dob, section, membership_stage') 
            .order('name');

        if (data) setYouthList(data);
    };

    const deleteParent = async (id) => {
        if (confirm('Are you sure you want to delete this parent?')) {
            await supabase.from('parent').delete().eq('id', id);
            fetchParents();
        }
    };

    const deleteYouth = async (id) => {
        if (confirm('Are you sure you want to delete this youth?')) {
            await supabase.from('youth').delete().eq('id', id);
            fetchYouth();
        }
    };

    const renderTableRow = (entry, type) => {
        const isEditing = type === 'parent' ? editingParentId === entry.id : editingYouthId === entry.id;
        const currentForm = type === 'parent' ? formData : youthForm;

        return (
            <tr key={entry.id}>
                {isEditing ? (
                    <>
                        <td><input value={currentForm.name} onChange={(e) => updateForm(e, type, 'name')} /></td>
                        <td>{type === 'parent' ?
                            <input value={currentForm.email} onChange={(e) => updateForm(e, type, 'email')} /> :
                            <input type="date" value={currentForm.dob} onChange={(e) => updateForm(e, type, 'dob')} />}
                        </td>
                        <td>{type === 'parent' ?
                            <input value={currentForm.phone} onChange={(e) => updateForm(e, type, 'phone')} /> :
                            <select value={currentForm.section} onChange={(e) => updateForm(e, type, 'section')}>
                                <option value="Joeys">Joeys</option>
                                <option value="Cubs">Cubs</option>
                                <option value="Scouts">Scouts</option>
                                <option value="Venturers">Venturers</option>
                            </select>}
                        </td>
                        {type === 'youth' && (
                            <td>
                                <select
                                    value={currentForm.membership_stage || ''}
                                    onChange={(e) => updateForm(e, type, 'membership_stage')}
                                >
                                    <option value="">Select</option>
                                    <option value="Invested">Invested</option>
                                    <option value="Have a Go">Have a Go</option>
                                    <option value="Linking">Linking</option>
                                </select>
                            </td>
                        )}
                        <td>
                            <button title="Save" onClick={() => saveEntry(type, entry.id)}><Check size={16} /></button>
                            <button title="Cancel" onClick={() => cancelEdit(type)}><X size={16} /></button>
                        </td>
                    </>
                ) : (
                    <>
                        <td>{entry.name}</td>
                        <td>{type === 'parent' ? entry.email : entry.dob}</td>
                            <td>{type === 'parent' ? entry.phone : entry.section}</td>
                            <td>
                                {type === 'parent'
                                    ? null
                                    : isEditing ? (
                                        <select value={currentForm.membership_stage} onChange={(e) => updateForm(e, type, 'membership_stage')}>
                                            <option value="">Select</option>
                                            <option value="Invested">Invested</option>
                                            <option value="Have a Go">Have a Go</option>
                                            <option value="Linking">Linking</option>
                                        </select>
                                    ) : (
                                        entry.membership_stage || '-'
                                    )
                                }
                            </td>
                        <td>
                            <button title="Edit" onClick={() => startEdit(type, entry)}><Pencil size={16} /></button>
                            <button title="Delete" onClick={() => type === 'parent' ? deleteParent(entry.id) : deleteYouth(entry.id)}><Trash size={16} /></button>
                        </td>
                    </>
                )}
            </tr>
        );
    };

    const updateForm = (e, type, field) => {
        const value = e.target.value;
        type === 'parent'
            ? setFormData({ ...formData, [field]: value })
            : setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });

    };

    const cancelEdit = (type) => {
        type === 'parent' ? setEditingParentId(null) : setEditingYouthId(null);
        type === 'parent' ? setFormData({ name: '', phone: '', email: '' }) : setYouthForm({ name: '', dob: '', section: '', membership_stage: '' });

    };

    const saveEntry = async (type, id) => {
        const table = type === 'parent' ? 'parent' : 'youth';
        const form = type === 'parent' ? formData : youthForm;
        await supabase.from(table).update(form).eq('id', id);
        type === 'parent' ? fetchParents() : fetchYouth();
        cancelEdit(type);
    };

    const startEdit = (type, entry) => {
        if (type === 'parent') {
            setEditingParentId(entry.id);
            setFormData(entry);
        } else {
            setEditingYouthId(entry.id);
            setYouthForm({
                name: entry.name,
                dob: entry.dob,
                section: entry.section,
                membership_stage: entry.membership_stage || ''
            });
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'attendance':
                const exportCSV = () => {
                    const rows = [
                        ['Name', 'Section', 'Sign In Time', 'Signed In By', 'Sign Out Time', 'Signed Out By'],
                        ...filteredAttendance.map(({ youth, signIn, signOut }) => [
                            youth.name,
                            youth.section,
                            signIn ? new Date(signIn.timestamp).toLocaleTimeString() : '',
                            signIn?.signed_by || '',
                            signOut ? new Date(signOut.timestamp).toLocaleTimeString() : '',
                            signOut?.signed_by || ''
                        ])
                    ];

                    const csvContent = 'data:text/csv;charset=utf-8,' +
                        rows.map(e => e.join(',')).join('\n');

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
                        <h2>Attendance Records</h2>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <label>
                                Section:{' '}
                                <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="Joeys">Joeys</option>
                                    <option value="Cubs">Cubs</option>
                                    <option value="Scouts">Scouts</option>
                                    <option value="Venturers">Venturers</option>
                                </select>
                            </label>

                            <label>
                                Date:{' '}
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </label>

                            <button
                                onClick={fetchAttendance}
                                title="Refresh"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <RefreshCcw size={20} color="#0F5BA4" />
                            </button>


                            <button
                                onClick={exportCSV}
                                title="Export to CSV"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <Download size={20} color="#0F5BA4" />
                            </button>
                        </div>

                        <div className="table-container">
                            <table className="scout-table">
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
                                            <td>
                                                {signIn ? `${new Date(signIn.timestamp).toLocaleTimeString()} by ${signIn.signed_by}` : '-'}
                                            </td>
                                            <td>
                                                {signOut ? `${new Date(signOut.timestamp).toLocaleTimeString()} by ${signOut.signed_by}` : '-'}
                                            </td>
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
                            </table>
                        </div>
                    </div>
                );


            case 'add-parent':
                return (
                    <div className="content-box">
                        <h2>Add/Edit Parent</h2>
                        <div className="table-container">
                            <table className="scout-table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Phone</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {parents.map((p) => renderTableRow(p, 'parent'))}
                                    {editingParentId === null && (
                                        <tr>
                                            <td><input value={formData.name} onChange={(e) => updateForm(e, 'parent', 'name')} /></td>
                                            <td><input value={formData.email} onChange={(e) => updateForm(e, 'parent', 'email')} /></td>
                                            <td><input value={formData.phone} onChange={(e) => updateForm(e, 'parent', 'phone')} /></td>
                                            <td>
                                                <button title="Add" onClick={async () => {
                                                    if (!formData.name || !formData.email || !formData.phone) return;
                                                    await supabase.from('parent').insert([formData]);
                                                    fetchParents();
                                                    setFormData({ name: '', phone: '', email: '' });
                                                }}><Plus size={16} /></button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'add-youth':
                return (
                    <div className="content-box">
                        <h2>Add/Edit Youth</h2>
                        <label>
                            Filter by section:
                            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                                <option value="">All</option>
                                <option value="Joeys">Joeys</option>
                                <option value="Cubs">Cubs</option>
                                <option value="Scouts">Scouts</option>
                                <option value="Venturers">Venturers</option>
                            </select>
                        </label>
                        <div className="table-container">
                            <table className="scout-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>DOB</th>
                                        <th>Section</th>
                                        <th>Stage</th> 
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {youthList.filter((y) => !sectionFilter || y.section === sectionFilter).map((y) => renderTableRow(y, 'youth'))}
                                    {editingYouthId === null && (
                                        <tr>
                                            <td><input value={youthForm.name} onChange={(e) => updateForm(e, 'youth', 'name')} /></td>
                                            <td><input type="date" value={youthForm.dob} onChange={(e) => updateForm(e, 'youth', 'dob')} /></td>
                                            <td>
                                                <select value={youthForm.section} onChange={(e) => updateForm(e, 'youth', 'section')}>
                                                    <option value="">Select</option>
                                                    <option value="Joeys">Joeys</option>
                                                    <option value="Cubs">Cubs</option>
                                                    <option value="Scouts">Scouts</option>
                                                    <option value="Venturers">Venturers</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select value={youthForm.membership_stage} onChange={(e) => updateForm(e, 'youth', 'membership_stage')}>
                                                    <option value="">Select</option>
                                                    <option value="Invested">Invested</option>
                                                    <option value="Have a Go">Have a Go</option>
                                                    <option value="Linking">Linking</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button title="Add" onClick={async () => {
                                                    if (!youthForm.name || !youthForm.dob || !youthForm.section) return;
                                                    await supabase.from('youth').insert([youthForm]);
                                                    fetchYouth();
                                                    setYouthForm({ name: '', dob: '', section: '' });
                                                }}><Plus size={16} /></button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <div className="content-box"><h2>{view}</h2><p>Coming soon.</p></div>;
        }
    };

    return (
        <RequireAuth>
            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar onNavigate={setView} />
                <div className="scout-container">{renderContent()}</div>
            </div>
        </RequireAuth>
    );
}