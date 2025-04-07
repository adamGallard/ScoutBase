import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from './assets/scoutbase-logo.png';
import { Shield } from 'lucide-react';

import { fetchGroupBySlug } from './helpers/groupHelper';
import { searchParentByNameOrPhone, verifyParentPin } from './helpers/authHelper';
import { fetchYouthByParentId, saveAttendanceRecord } from './helpers/attendanceHelper';
import SignInForm from './components/SignInForm';

const getTodayDate = () => new Date().toISOString().split('T')[0];
const LOCAL_STORAGE_KEY = 'scout-attendance-data';

const useQuery = () => new URLSearchParams(useLocation().search);

export default function SignInOutPage() {
    const query = useQuery();
    const groupSlug = query.get('group');

    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [groupNotFound, setGroupNotFound] = useState(false);

    const [statusByDate, setStatusByDate] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [youthList, setYouthList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sectionFilter, setSectionFilter] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [pin, setPin] = useState('');
    const [matchingParent, setMatchingParent] = useState(null);
    const [parentName, setParentName] = useState('');
    const [error, setError] = useState('');

    const today = getTodayDate();
    const filteredYouthList = youthList.filter((m) => sectionFilter === '' || m.section === sectionFilter);

    // Load cached attendance
    useEffect(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            setStatusByDate(JSON.parse(stored));
        }
    }, []);

    // Save cached attendance
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(statusByDate));
    }, [statusByDate]);

    // Load group info
    useEffect(() => {
        const loadGroup = async () => {
            const { data, error } = await fetchGroupBySlug(groupSlug);
            if (data) {
                setGroupId(data.id);
                setGroupName(data.name);
                setGroupNotFound(false);
            } else {
                console.error('Group not found:', error);
                setGroupNotFound(true);
            }
        };
        if (groupSlug) loadGroup();
    }, [groupSlug]);

    const handleSign = (memberId, data) => {
        setStatusByDate((prev) => {
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

    const handleSearch = async () => {
        setError('');
        const { data: parents, error } = await searchParentByNameOrPhone(searchTerm);

        if (error || !parents?.length) {
            setError('Invalid name or PIN. Please try again.');
            return;
        }

        const parent = parents[0];
        const isValid = await verifyParentPin(pin, parent.pin_hash);

        if (!isValid || parent.group_id !== groupId) {
            setError('Invalid name or PIN. Please try again.');
            return;
        }

        setMatchingParent(parent);
        setParentName(parent.name);
        const { data: youth } = await fetchYouthByParentId(parent.id);
        setYouthList(youth || []);
        setSubmitted(true);
    };

    if (groupNotFound) {
        return (
            <div className="scout-container">
                <h1>Group Not Found</h1>
                <p>We couldn't find the Scout group you're looking for. Please check the link or contact your Scout leader.</p>
                <Link to="/">Return to Home</Link>
            </div>
        );
    }

    return (
        <>
            <img src={logo} alt="ScoutBase Logo" style={{ maxWidth: '150px', margin: '1rem auto 0', display: 'block' }} />
            <div className="scout-container">
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <Link to="/admin-login" title="Admin Area" style={{ color: '#0F5BA4' }}>
                        <Shield size={30} />
                    </Link>
                </div>

                <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.25rem' }}>
                    {groupName ? `${groupName} Sign In / Out` : 'Scout Sign In / Out'}
                </h1>
                <p style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '1.5rem', color: '#333' }}>
                    Enter your name to see the youth members linked to you. Then select a child to sign them in or out, with an optional comment.
                </p>

                {!submitted ? (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await handleSearch();
                        }}
                        className="text-center"
                    >
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter parent name or phone number"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                            />
                            <input
                                type="password"
                                placeholder="Enter 4-digit PIN"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
                            />
                            <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                                Continue
                            </button>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </div>
                    </form>
                ) : (
                    <>
                        {loading && <p>Loading children...</p>}

                        {!selectedMember && (
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
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
                                {matchingParent && (
                                    <div style={{ fontWeight: 'bold', color: '#0F5BA4' }}>
                                        Logged in as: {matchingParent.name}
                                    </div>
                                )}
                            </div>
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
                                    groupId={groupId}
                                />
                                <button style={{ marginTop: '12px' }} onClick={() => setSelectedMember(null)}>Back</button>
                            </>
                        )}

                        <button
                            style={{ marginTop: '1rem' }}
                            onClick={() => {
                                setSubmitted(false);
                                setParentName('');
                                setSearchTerm('');
                                setPin('');
                                setMatchingParent(null);
                                setYouthList([]);
                                setSelectedMember(null);
                            }}
                        >
                            Switch Parent
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
