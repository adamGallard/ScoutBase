import { useEffect, useState } from 'react';
import { FileText, UserPlus, Users, Link2, BarChart2, Menu, ArrowLeft, LogOut, Pencil, Check, X, Trash, Plus, RefreshCcw, Download, Calendar, ChevronUp, ChevronDown, Key } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/scoutbase-logo.png';
import { useTerrainUser } from '../hooks/useTerrainUser';
import bcrypt from 'bcryptjs';
import { useLocation } from 'react-router-dom';


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
        }}><button onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar" style={btnStyle}>
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
                            localStorage.removeItem('scoutbase-terrain-token');
                            localStorage.removeItem('scoutbase-username');
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
    const { userName } = useTerrainUser(); // Get the user name
    const [parentFilter, setParentFilter] = useState(''); 
    const [youthFilter, setYouthFilter] = useState('');
    const [parentSortField, setParentSortField] = useState('name');
    const [parentSortAsc, setParentSortAsc] = useState(true);
    const [youthSortField, setYouthSortField] = useState('name');
    const [youthSortAsc, setYouthSortAsc] = useState(true);

    const [showPinModal, setShowPinModal] = useState(false);
    const [pinParentId, setPinParentId] = useState(null);
    const [newPin, setNewPin] = useState('');


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

    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [linkedYouth, setLinkedYouth] = useState([]);
    const [availableYouth, setAvailableYouth] = useState([]);

    const openLinkModal = async (parentId) => {
        setSelectedParentId(parentId);
        setLinkModalOpen(true);

        // Load linked youth
        const { data: links } = await supabase
            .from('parent_youth')
            .select('youth (id, name, section)')
            .eq('parent_id', parentId);

        setLinkedYouth(links.map(l => l.youth));

        // Load all youth for dropdown
        const { data: allYouth } = await supabase
            .from('youth')
            .select('id, name, section');

        setAvailableYouth(allYouth);
    };

    const addLink = async (youthId) => {
        await supabase.from('parent_youth').insert([
            { parent_id: selectedParentId, youth_id: youthId }
        ]);
        openLinkModal(selectedParentId); // reload list
    };

    const removeLink = async (youthId) => {
        await supabase.from('parent_youth')
            .delete()
            .eq('parent_id', selectedParentId)
            .eq('youth_id', youthId);
        openLinkModal(selectedParentId); // reload list
    };


    const renderTableRow = (entry, type) => {
        const isEditing = type === 'parent' ? editingParentId === entry.id : editingYouthId === entry.id;
        const currentForm = type === 'parent' ? formData : youthForm;

        return (
            <tr key={entry.id}>
                <td>{isEditing ? <input value={currentForm.name} onChange={(e) => updateForm(e, type, 'name')} /> : entry.name}</td>
                <td>
                    {isEditing
                        ? type === 'parent'
                            ? <input value={currentForm.email} onChange={(e) => updateForm(e, type, 'email')} />
                            : <input type="date" value={currentForm.dob} onChange={(e) => updateForm(e, type, 'dob')} />
                        : type === 'parent'
                            ? entry.email
                            : entry.dob
                    }
                </td>
                <td>
                    {isEditing
                        ? type === 'parent'
                            ? <input value={currentForm.phone} onChange={(e) => updateForm(e, type, 'phone')} />
                            : <select value={currentForm.section} onChange={(e) => updateForm(e, type, 'section')}>
                                <option value="Joeys">Joeys</option>
                                <option value="Cubs">Cubs</option>
                                <option value="Scouts">Scouts</option>
                                <option value="Venturers">Venturers</option>
                            </select>
                        : type === 'parent'
                            ? entry.phone
                            : entry.section
                    }
                </td>
                <td>
                    {type === 'youth' ? (
                        isEditing ? (
                            <select value={currentForm.membership_stage || ''} onChange={(e) => updateForm(e, type, 'membership_stage')}>
                                <option value="">Select</option>
                                <option value="Invested">Invested</option>
                                <option value="Have a Go">Have a Go</option>
                                <option value="Linking">Linking</option>
                            </select>
                        ) : (
                            entry.membership_stage || '-'
                        )
                    ) : (
                        '' // <-- placeholder cell for parent rows
                    )}
                </td>
                <td>
                    {isEditing ? (
                        <>
                            <button title="Save" onClick={() => saveEntry(type, entry.id)}><Check size={16} /></button>
                            <button title="Cancel" onClick={() => cancelEdit(type)}><X size={16} /></button>
                        </>
                    ) : (
                        <>
                            <button title="Edit" onClick={() => startEdit(type, entry)}><Pencil size={16} /></button>
                            <button title="Delete" onClick={() => type === 'parent' ? deleteParent(entry.id) : deleteYouth(entry.id)}><Trash size={16} /></button>
                            {type === 'parent' && (
                                <>
                                    <button title="Details" onClick={() => openLinkModal(entry.id)}>
                                        <Link2 size={16} />
                                    </button>
                                    <button
                                        title="Update PIN"
                                        onClick={() => {
                                            setPinParentId(entry.id);
                                            setNewPin('');
                                            setShowPinModal(true);
                                        }}
                                    >
                                        <Key size={16} />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </td>
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

    const toggleSort = (field) => {
        if (parentSortField === field) {
            setParentSortAsc(!parentSortAsc);
        } else {
            setParentSortField(field);
            setParentSortAsc(true);
        }
    };

    const toggleYouthSort = (field) => {
        if (youthSortField === field) {
            setYouthSortAsc(!youthSortAsc);
        } else {
            setYouthSortField(field);
            setYouthSortAsc(true);
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
                            signIn ? new Date(signIn.timestamp).toLocaleString() : '',
                            signIn?.signed_by || '',
                            signOut ? new Date(signOut.timestamp).toLocaleString() : '',
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
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ccc',
                                        fontSize: '1rem',
                                        backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z"/></svg>')`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 0.75rem center',
                                        backgroundSize: '20px 20px',
                                        appearance: 'none',
                                        WebkitAppearance: 'none', // for Safari
                                    }}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Add/Edit Parent</h2>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={parentFilter}
                                onChange={(e) => setParentFilter(e.target.value.toLowerCase())}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                            />
                        </div>
                        <div className="table-container">
                            <table className="scout-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Name
                                            {parentSortField === 'name' &&
                                                (parentSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th onClick={() => toggleSort('email')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Email
                                            {parentSortField === 'email' &&
                                                (parentSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th onClick={() => toggleSort('phone')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Phone
                                            {parentSortField === 'phone' &&
                                                (parentSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th></th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...parents]
                                        .filter((p) =>
                                            p.name.toLowerCase().includes(parentFilter) ||
                                            p.email.toLowerCase().includes(parentFilter)
                                        )
                                        .sort((a, b) => {
                                            const valA = a[parentSortField]?.toLowerCase?.() || '';
                                            const valB = b[parentSortField]?.toLowerCase?.() || '';
                                            return parentSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                                        })
                                        .map((p) => renderTableRow(p, 'parent'))}
                                    {editingParentId === null && (
                                        <tr>
                                            <td><input value={formData.name} onChange={(e) => updateForm(e, 'parent', 'name')} /></td>
                                            <td><input value={formData.email} onChange={(e) => updateForm(e, 'parent', 'email')} /></td>
                                            <td><input value={formData.phone} onChange={(e) => updateForm(e, 'parent', 'phone')} /></td>
                                            <td></td>
                                            <td>
                                                <button
                                                    title="Add"
                                                    onClick={async () => {
                                                        if (!formData.name || !formData.email || !formData.phone) return;
                                                        await supabase.from('parent').insert([formData]);
                                                        fetchParents();
                                                        setFormData({ name: '', phone: '', email: '' });
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                </button>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>Add/Edit Youth</h2>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={youthFilter}
                                onChange={(e) => setYouthFilter(e.target.value.toLowerCase())}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                            />
                        </div>
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
                                        <th onClick={() => toggleYouthSort('name')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Name {youthSortField === 'name' && (youthSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th onClick={() => toggleYouthSort('dob')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            DOB {youthSortField === 'dob' && (youthSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th onClick={() => toggleYouthSort('section')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Section {youthSortField === 'section' && (youthSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th onClick={() => toggleYouthSort('membership_stage')} style={{ cursor: 'pointer', display: 'table-cell', alignItems: 'center', gap: '0.3rem' }}>
                                            Stage {youthSortField === 'membership_stage' && (youthSortAsc ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...youthList]
                                        .filter((y) =>
                                            (!sectionFilter || y.section === sectionFilter) &&
                                            y.name.toLowerCase().includes(youthFilter)
                                        )
                                        .sort((a, b) => {
                                            const valA = a[youthSortField]?.toLowerCase?.() || a[youthSortField] || '';
                                            const valB = b[youthSortField]?.toLowerCase?.() || b[youthSortField] || '';
                                            return youthSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                                        })
                                        .map((y) => renderTableRow(y, 'youth'))}
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

    const { userInfo, loading: userLoading, error: userError } = useTerrainUser();
   // console.log('Terrain user info:', userInfo);

    return (
        <RequireAuth>
            {showPinModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Update PIN</h3>
                        <p>Enter a new 4-digit PIN for this parent:</p>
                        <input
                            type="password"
                            value={newPin}
                            maxLength={4}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="1234"
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={async () => {
                                    if (!newPin) {
                                        alert('Please enter a new PIN');
                                        return;
                                    }

                                    const salt = await bcrypt.genSalt(10);
                                    const hashedPin = await bcrypt.hash(newPin, salt);

                                    await supabase
                                        .from('parent')
                                        .update({ pin_hash: hashedPin })
                                        .eq('id', pinParentId);

                                    setShowPinModal(false);
                                    setPinParentId(null);
                                    setNewPin('');
                                    fetchParents();
                                }}
                            >
                                Save
                            </button>
                            <button onClick={() => setShowPinModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>

                {/* Header Bar */}
                <div style={{
                    backgroundColor: '#0F5BA4',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {/* Logo and Title Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img
                            src={logo}
                            alt="ScoutBase Logo"
                            style={{
                                maxWidth: '40px',
                                height: 'auto'
                            }}
                        />
                        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Admin</h1>
                    </div>

                    {/* Logged In User */}
                    <div style={{ fontSize: '0.9rem' }}>
                        Logged in as: <strong>{userLoading ? 'Loading...' : userInfo?.name || 'Unknown User'}</strong>
                    </div>
                </div>

            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar onNavigate={setView} />
                <div className="scout-container">{renderContent()}</div>
                </div>
            </div>
            {linkModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Youth linked to this parent</h3>

                        <ul>
                            {linkedYouth.map((youth) => (
                                <li key={youth.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{youth.name} ({youth.section})</span>
                                    <button onClick={() => removeLink(youth.id)}>Remove</button>
                                </li>
                            ))}
                        </ul>

                        <h4>Add Youth</h4>
                        <select onChange={(e) => addLink(e.target.value)} defaultValue="">
                            <option value="" disabled>Select a youth...</option>
                            {availableYouth
                                .filter(y => !linkedYouth.find(l => l.id === y.id))
                                .map(y => (
                                    <option key={y.id} value={y.id}>{y.name} ({y.section})</option>
                                ))}
                        </select>

                        <div style={{ marginTop: '1rem' }}>
                            <button onClick={() => setLinkModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </RequireAuth>
    );
}