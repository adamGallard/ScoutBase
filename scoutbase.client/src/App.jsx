import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import './App.css';
import logo from './assets/scoutbase-logo.png';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminPage from './AdminPage';
import { Shield } from 'lucide-react';
import AdminLogin from './AdminLogin';
import bcrypt from 'bcryptjs';


const getTodayDate = () => new Date().toISOString().split('T')[0];


const SignInForm = ({ member, onSign, parentName, latestStatus }) => {
    const [comment, setComment] = useState('');
    const lastAction = latestStatus?.action;

    const handleSubmit = async (action) => {
        const timestamp = new Date();
        const data = {
            action,
            signed_by: parentName,
            event_date: getTodayDate(),
            timestamp: timestamp.toISOString(),
            youth_id: member.id,
            comment,
        };

        const { error } = await supabase.from('attendance').insert([data]);

        if (error) {
            alert('Error saving attendance');
            console.error(error);
        } else {
            onSign(member.id, {
                action,
                time: timestamp.toLocaleTimeString(),
                by: parentName,
                comment,
            });
        }
    };

    return (
        <div className="space-y-4">
            <h2>Signing for: {member.name} ({member.section})</h2>
            <textarea
                placeholder="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                {lastAction !== 'signed in' && <button onClick={() => handleSubmit('signed in')}>Sign In</button>}
                {lastAction === 'signed in' && <button onClick={() => handleSubmit('signed out')}>Sign Out</button>}
            </div>
        </div>
    );
};

const LOCAL_STORAGE_KEY = 'scout-attendance-data';

const SignInOutPage = () => {
    const [statusByDate, setStatusByDate] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [parentName, setParentName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [youthList, setYouthList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sectionFilter, setSectionFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pin, setPin] = useState('');
    const [matchingParent, setMatchingParent] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            setStatusByDate(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(statusByDate));
    }, [statusByDate]);

    const handleSign = (memberId, data) => {
        setStatusByDate((prev) => {
            const today = getTodayDate();
            const existing = prev[today]?.[memberId] || [];
            return {
                ...prev,
                [today]: {
                    ...(prev[today] || {}),
                    [memberId]: [...existing, data],
                },
            };
        });
        setSelectedMember(null);
    };

    const verifyPin = async (enteredPin, storedHash) => {
        return await bcrypt.compare(enteredPin, storedHash);
    };

    const handleSearch = async () => {
        setError('');
        const { data, error } = await supabase
            .from('parent')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

        if (error) {
            setError('Error searching.');
            return;
        }

        if (!data || data.length === 0) {
            setError('No matching parent found.');
            return;
        }

        const found = data[0];
        const isValid = await verifyPin(pin, found.pin_hash);

        if (isValid) {
            setMatchingParent(found); // optional if you want to store the whole object
            setParentName(found.name); //  <-- fix: set correct parent name
            await fetchYouthByParent(found.id); // or use `found.id` instead
            setSubmitted(true); // 
        } else {
            setError('Incorrect PIN.');
            return;
        }
    };



    const fetchYouthByParent = async (parentId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('parent_youth')
            .select('youth (id, name, dob, section)')
            .eq('parent_id', parentId);

        if (error) {
            console.error('Error fetching youth:', error);
            setYouthList([]);
        } else {
            setYouthList(data.map((entry) => entry.youth));
        }
        setLoading(false);
    };

    const today = getTodayDate();
    const filteredYouthList = youthList.filter((m) => sectionFilter === '' || m.section === sectionFilter);

    return (
        <>
            <img src={logo} alt="ScoutBase Logo" style={{ maxWidth: '150px', margin: '1rem auto 0', display: 'block' }} />
            <div className="scout-container">
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <Link to="/admin-login" title="Admin Area" style={{ color: '#0F5BA4' }}>
                        <Shield size={30} />
                    </Link>
                </div>
                <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>Scout Sign In / Out</h1>
                <p style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '1.5rem', color: '#333' }}>
                    Enter your name to see the youth members linked to you. Then select a child to sign them in or out, with an optional comment.
                </p>

                {!submitted ? (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                          }}
                        className="text-center"
                    >
                        <div className="space-y-4">
                            <label htmlFor="parentName">Enter your name:</label>
                            <input
                                type="text"
                                placeholder="Enter parent name or phone number"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                            /> <br></br><input
                                type="password"
                                placeholder="Enter 4-digit PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                            />

                            <button onClick={handleSearch} style={{ padding: '0.5rem 1rem' }}>
                                Continue
                            </button>

                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </div>
                    </form>
                ) : (
                    <>
                        {loading ? <p>Loading children...</p> : null}

                            {!selectedMember && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label htmlFor="sectionFilter" style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>
                                        Filter by section:
                                    </label>
                                    <select
                                        id="sectionFilter"
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="Joeys">Joeys</option>
                                        <option value="Cubs">Cubs</option>
                                        <option value="Scouts">Scouts</option>
                                        <option value="Venturers">Venturers</option>
                                    </select>
                                </div>
                            )}

                        {filteredYouthList.length === 0 && !loading && (
                            <p>No children found for "{parentName}" in section "{sectionFilter || 'All'}"</p>
                        )}

                        {!selectedMember ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredYouthList.map((m) => {
                                    const latest = statusByDate[today]?.[m.id]?.slice(-1)[0];
                                    return (
                                        <div key={m.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px', backgroundColor: '#fff' }}>
                                            <button
                                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px' }}
                                                onClick={() => setSelectedMember(m)}
                                            >
                                                <div>
                                                    <div>{m.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'lightgoldenrodyellow' }}>{m.section}</div>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', textAlign: 'right', color: latest?.action === 'signed in' ? 'lime' : 'tomato' }}>
                                                    {latest ? `${latest.action} at ${latest.time}` : 'Not signed in'}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                <SignInForm
                                    member={selectedMember}
                                    parentName={parentName}
                                    onSign={handleSign}
                                    latestStatus={statusByDate[today]?.[selectedMember.id]?.slice(-1)[0] || null}
                                />
                                <button style={{ marginTop: '12px' }} onClick={() => setSelectedMember(null)}>Back</button>
                            </>
                        )}

                        <button style={{ marginTop: '1rem' }} onClick={() => { setSubmitted(false); setParentName(''); setYouthList([]); }}>Switch Parent</button>
                    </>
                )}
            </div>
        </>
    );
};

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<SignInOutPage />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Router>
    );
}
