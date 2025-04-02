// Scout Sign-in App Entry Point
// For GitHub Pages deployment, create-react-app compatible

import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';

const members = [
    { id: '1', name: 'Zoe Gallard' },
    { id: '2', name: 'Maya Gallard' },
    { id: '3', name: 'TJ Smith' },
];

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
                <button onClick={() => handleSubmit('Signed In')}>Sign In</button>
                <button onClick={() => handleSubmit('Signed Out')}>Sign Out</button>
            </div>
        </div>
    );
};

const LOCAL_STORAGE_KEY = 'scout-attendance-data';

const SignInOutPage = () => {
    const [statusByDate, setStatusByDate] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [currentDate, setCurrentDate] = useState(getTodayDate());

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

    const status = statusByDate[currentDate] || {};

    return (
        <div style={{ padding: '16px', maxWidth: '600px', margin: 'auto' }}>
            <h1>Scout Sign In / Out</h1>

            <div style={{ marginBottom: '16px' }}>
                <label>Select Date: </label>
                <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                />
            </div>

            {!selectedMember ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {members.map((m) => (
                        <div key={m.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px' }}>
                            <button
                                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px' }}
                                onClick={() => setSelectedMember(m)}
                            >
                                <span>{m.name}</span>
                                <span style={{ fontSize: '0.875rem', color: '#555' }}>
                                    {status[m.id]?.length ? `${status[m.id][status[m.id].length - 1].action} @ ${status[m.id][status[m.id].length - 1].time}` : 'No records'}
                                </span>
                            </button>
                            {status[m.id]?.length > 0 && (
                                <ul style={{ marginTop: '8px', fontSize: '0.875rem', color: '#333' }}>
                                    {status[m.id].map((record, idx) => (
                                        <li key={idx}>- {record.action} by {record.by} at {record.time}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <SignInForm member={selectedMember} onSign={handleSign} />
                    <button style={{ marginTop: '12px' }} onClick={() => setSelectedMember(null)}>Cancel</button>
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
