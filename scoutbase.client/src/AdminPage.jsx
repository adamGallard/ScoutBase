// AdminPage layout with sidebar and route protection
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import './App.css';
import { useNavigate } from 'react-router-dom';
import logo from './assets/scoutbase-logo.svg';

function RequireAuth({ children }) {
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const isAuthed = localStorage.getItem('scoutbase-admin-authed');

        if (isAuthed === 'true') {
            setChecked(true); // Allow page to load
        } else {
            // Delay redirect to avoid a loop during React Router transition
            setTimeout(() => {
                navigate('/admin-login', { replace: true });
            }, 0);
        }
    }, [navigate]);

    if (!checked) return null; // Optional: add a <p>Loading...</p> if you want
    return children;
}

function Sidebar({ onNavigate }) {
    return (
        <div style={{ width: '200px', padding: '1rem', backgroundColor: '#eee', height: '100%' }}>
            <h3>Admin Tools</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><button onClick={() => onNavigate('attendance')}>Attendance</button></li>
                <li><button onClick={() => onNavigate('add-parent')}>Add Parent</button></li>
                <li><button onClick={() => onNavigate('add-youth')}>Add Youth</button></li>
                <li><button onClick={() => onNavigate('link')}>Link Parent/Youth</button></li>
                <li><button onClick={() => onNavigate('reports')}>Reports</button></li>
                <li><button onClick={() => {
                    localStorage.removeItem('scoutbase-admin-authed');
                    window.location.href = '/admin-login';
                }}>Logout</button></li>
            </ul>
        </div>
    );
}

export default function AdminPage() {
    const [youthName, setYouthName] = useState('');
    const [dob, setDob] = useState('');
    const [section, setSection] = useState('');
    const [addYouthSuccess, setAddYouthSuccess] = useState(false);
    const [addYouthError, setAddYouthError] = useState('');
    const [parentName, setParentName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [email, setEmail] = useState('');
    const [addParentSuccess, setAddParentSuccess] = useState(false);
    const [addParentError, setAddParentError] = useState('');
    const [records, setRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('attendance');

    useEffect(() => {
        if (view === 'attendance') fetchAttendance();
    }, [selectedDate, view]);

    const fetchAttendance = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('attendance')
            .select('*, youth (name, section)')
            .eq('event_date', selectedDate)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error loading attendance:', error);
        } else {
            setRecords(data);
        }
        setLoading(false);
    };

    const handleAddParent = async (e) => {
        e.preventDefault();
        setAddParentSuccess(false);
        setAddParentError('');
        const { error } = await supabase.from('parent').insert({
            name: parentName,
            phone: contactNumber,
            email: email
        });
        if (error) {
            setAddParentError('Failed to add parent.');
            console.error(error);
        } else {
            setAddParentSuccess(true);
            setParentName('');
            setContactNumber('');
            setEmail('');
        }
    };

    const handleAddYouth = async (e) => {
        e.preventDefault();
        setAddYouthSuccess(false);
        setAddYouthError('');
        const { error } = await supabase.from('youth').insert({
            name: youthName,
            dob: dob,
            section: section
        });
        if (error) {
            setAddYouthError('Failed to add youth.');
            console.error(error);
        } else {
            setAddYouthSuccess(true);
            setYouthName('');
            setDob('');
            setSection('');
        }
    };

    const renderContent = () => {
        switch (view) {
            case 'attendance':
                return (

                    <div>

                        <h2>Attendance Records</h2>
                        <label style={{ marginTop: '1rem' }}>Select Date:
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ marginLeft: '0.5rem' }}
                            />
                        </label>
                        {loading ? <p>Loading...</p> : (
                            <ul style={{ marginTop: '1rem', paddingLeft: 0 }}>
                                {records.length === 0 ? <p>No records for this date.</p> : (
                                    records.map((r, i) => (
                                        <li key={i} style={{ listStyle: 'none', marginBottom: '0.75rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
                                            <strong>{r.youth.name}</strong> ({r.youth.section})<br />
                                            {r.action} at {new Date(r.timestamp).toLocaleTimeString()} by {r.signed_by}
                                            {r.comment && <div style={{ fontStyle: 'italic', color: '#555' }}>Comment: {r.comment}</div>}
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                );
            case 'add-parent':
                return (
                    <div>
                        <h2>Add Parent</h2>
                        <form onSubmit={handleAddParent} className="space-y-4">
                            <div>
                                <label htmlFor="parentName">Name</label><br />
                                <input type="text" id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="contact">Contact Number</label><br />
                                <input type="text" id="contact" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="email">Email</label><br />
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit">Add Parent</button>
                            {addParentSuccess && <p style={{ color: 'green' }}>Parent added successfully!</p>}
                            {addParentError && <p style={{ color: 'red' }}>{addParentError}</p>}
                        </form>
                    </div>
                );
            case 'add-youth':
                return (
                    <div>
                        <h2>Add Youth</h2>
                        <form onSubmit={handleAddYouth} className="space-y-4">
                            <div>
                                <label htmlFor="youthName">Name</label><br />
                                <input type="text" id="youthName" value={youthName} onChange={(e) => setYouthName(e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="dob">Date of Birth</label><br />
                                <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="section">Section</label><br />
                                <select id="section" value={section} onChange={(e) => setSection(e.target.value)} required>
                                    <option value="">Select Section</option>
                                    <option value="Joeys">Joeys</option>
                                    <option value="Cubs">Cubs</option>
                                    <option value="Scouts">Scouts</option>
                                    <option value="Venturers">Venturers</option>
                                </select>
                            </div>
                            <button type="submit">Add Youth</button>
                            {addYouthSuccess && <p style={{ color: 'green' }}>Youth added successfully!</p>}
                            {addYouthError && <p style={{ color: 'red' }}>{addYouthError}</p>}
                        </form>
                    </div>
                );
            case 'link':
                return <div><h2>Link Parent and Youth</h2><p>Form to link parent and youth will go here.</p></div>;
            case 'reports':
                return <div><h2>Attendance Reports</h2><p>Reports will be generated here.</p></div>;
            default:
                return <p>{view} screen coming soon!</p>;
        }
    };

    return (
        <RequireAuth>
            <div style={{ display: 'flex', height: '100vh' }}>
                <Sidebar onNavigate={setView} />
                <div className="scout-container" style={{ flex: 1 }}>
                    <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
                        <img src={logo} alt="ScoutBase Logo" style={{ maxWidth: '160px' }} />
                    </div>
                    {renderContent()}
                </div>
            </div>
        </RequireAuth>
    );
}
