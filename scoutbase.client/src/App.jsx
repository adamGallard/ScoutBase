// ScoutBase Sign In App with Supabase integration
import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { supabase } from './lib/supabaseClient';

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
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
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

    const fetchYouthByParent = async (name) => {
        setLoading(true);
        const { data: parents } = await supabase
            .from('parent')
            .select('id')
            .ilike('name', name);

        if (!parents || parents.length === 0) {
            setYouthList([]);
            setLoading(false);
            return;
        }

        const parentId = parents[0].id;
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
        <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Scout Sign In / Out</h1>

            {!submitted ? (
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await fetchYouthByParent(parentName);
                        setSubmitted(true);
                    }}
                    style={{ marginBottom: '1rem', textAlign: 'center' }}
                >
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="parentName">Enter your name:</label>
                        <input
                            id="parentName"
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="Parent name"
                            style={{ marginLeft: '0.5rem', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="sectionFilter">Filter by section:</label>
                        <select
                            id="sectionFilter"
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
                        >
                            <option value="">All</option>
                            <option value="Joeys">Joeys</option>
                            <option value="Cubs">Cubs</option>
                            <option value="Scouts">Scouts</option>
                            <option value="Venturers">Venturers</option>
                        </select>
                    </div>
                    <button type="submit" style={{ padding: '0.5rem 1rem' }}>Continue</button>
                </form>
            ) : (
                <>
                    {loading ? <p>Loading children...</p> : null}

                    {filteredYouthList.length === 0 && !loading && (
                        <p>No children found for "{parentName}" in section "{sectionFilter || 'All'}"</p>
                    )}

                    {!selectedMember ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredYouthList.map((m) => {
                                const latest = statusByDate[today]?.[m.id]?.slice(-1)[0];
                                return (
                                    <div key={m.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px' }}>
                                        <button
                                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px' }}
                                            onClick={() => setSelectedMember(m)}
                                        >
                                            <div>
                                                <div>{m.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{m.section}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', textAlign: 'right', color: latest?.action === 'signed in' ? 'green' : 'gray' }}>
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
    );
};

const QRCodeScreen = () => {
    const eventLink = `${window.location.origin}/signin/event/12345`;

    return (
        <div style={{ padding: '16px', textAlign: 'center' }}>
            <h2>Scan to Sign In</h2>
            <QRCode value={eventLink} size={200} />
            <p style={{ fontSize: '0.875rem', color: '#666' }}>This QR links to today’s sign-in sheet</p>
        </div>
    );
};

export default function App() {
    const [mode, setMode] = useState('signin');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', paddingBottom: '2rem' }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={() => setMode('signin')}>Sign In/Out</button>
                <button onClick={() => setMode('qr')}>Show QR Code</button>
            </div>
            {mode === 'signin' ? <SignInOutPage /> : <QRCodeScreen />}
        </div>
    );
}
