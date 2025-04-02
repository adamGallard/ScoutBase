// ScoutBase Sign In App with Supabase integration
import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { supabase } from './lib/supabaseClient'; // make sure this file exists and has the client config

const getTodayDate = () => new Date().toISOString().split('T')[0];

const SignInForm = ({ member, onSign }) => {
    const [signedBy, setSignedBy] = useState('');

    const handleSubmit = (action) => {
        if (!signedBy) return alert("Please enter your name.");
        const timestamp = new Date().toLocaleTimeString();
        onSign(member.id, { action, time: timestamp, by: signedBy });
    };

    return (
        <div className="space-y-4">
            <h2>Signing for: {member.name}</h2>
            <input
                type="text"
                placeholder="Your name"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleSubmit('signed in')}>Sign In</button>
                <button onClick={() => handleSubmit('signed out')}>Sign Out</button>
            </div>
        </div>
    );
};

const LOCAL_STORAGE_KEY = 'scout-attendance-data';

const SignInOutPage = () => {
    const [statusByDate, setStatusByDate] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [currentDate, setCurrentDate] = useState(getTodayDate());
    const [parentName, setParentName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [youthList, setYouthList] = useState([]);
    const [loading, setLoading] = useState(false);

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
            const existing = prev[currentDate]?.[memberId] || [];
            return {
                ...prev,
                [currentDate]: {
                    ...(prev[currentDate] || {}),
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

    return (
        <div style={{ padding: '16px', maxWidth: '600px', margin: 'auto' }}>
            <h1>Scout Sign In / Out</h1>

            {!submitted ? (
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await fetchYouthByParent(parentName);
                        setSubmitted(true);
                    }}
                    style={{ marginBottom: '16px' }}
                >
                    <label htmlFor="parentName">Enter your name:</label>
                    <input
                        id="parentName"
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Parent name"
                        style={{ marginLeft: '8px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ marginLeft: '8px' }}>Continue</button>
                </form>
            ) : (
                <>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Select Date: </label>
                        <input
                            type="date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                        />
                    </div>

                    {loading ? <p>Loading children...</p> : null}

                    {youthList.length === 0 && !loading && (
                        <p>No children found for "{parentName}"</p>
                    )}

                    {!selectedMember ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {youthList.map((m) => (
                                <div key={m.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px' }}>
                                    <button
                                        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px' }}
                                        onClick={() => setSelectedMember(m)}
                                    >
                                        <span>{m.name}</span>
                                        <span style={{ fontSize: '0.875rem', color: '#555' }}>
                                            {/* optional: show attendance status */}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <SignInForm member={selectedMember} onSign={handleSign} />
                            <button style={{ marginTop: '12px' }} onClick={() => setSelectedMember(null)}>Cancel</button>
                        </>
                    )}

                    <button style={{ marginTop: '16px' }} onClick={() => { setSubmitted(false); setParentName(''); setYouthList([]); }}>Switch Parent</button>
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
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setMode('signin')}>Sign In/Out</button>
                <button onClick={() => setMode('qr')}>Show QR Code</button>
            </div>
            {mode === 'signin' ? <SignInOutPage /> : <QRCodeScreen />}
        </div>
    );
}
