import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/scoutbase-logo.png';
import { Shield } from 'lucide-react';

import { fetchGroupBySlug } from '../helpers/groupHelper';
import { verifyPin } from '../helpers/authHelper';
import { searchParentByNameOrPhone, fetchYouthByParentId, fetchLatestAttendanceForYouthList } from '../helpers/attendanceHelper';
import { supabase } from '../lib/supabaseClient';

import SignInForm from '../components/SignInForm';
import Footer from '../components/Footer';
import {
    PageWrapper,
    Main,
    Content,
    LogoWrapper
} from '../components/SharedStyles';
import Header from '../components/Header';


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
    const [latestStatusMap, setLatestStatusMap] = useState({});




    useEffect(() => {
        const loadGroup = async () => {
            const { data, error } = await fetchGroupBySlug(groupSlug);
            if (data) {
                if (!data.active) {
                    setGroupNotFound(true); // Treat inactive group like not found
                    return;
                }
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

    const handleSign = async (memberId, data) => {
        const newStatusMap = await fetchLatestAttendanceForYouthList(supabase, youthList, groupId);
        setLatestStatusMap(newStatusMap);
        setSelectedMember(null);
    };

    const handleSearch = async () => {
        setError('');
        const { parent, error: searchError } = await searchParentByNameOrPhone(searchTerm, pin, groupId);

        if (searchError) {
            setError(searchError);
            return;
        }

        setMatchingParent(parent);
        setParentName(parent.name);

        const { youthList, error: youthError } = await fetchYouthByParentId(parent.id);

        if (youthError) {
            setError(youthError);
            return;
        }

        setYouthList(youthList);
        const statusMap = await fetchLatestAttendanceForYouthList(supabase, youthList, groupId);
        setLatestStatusMap(statusMap);
        setSubmitted(true);
    };

    if (groupNotFound) {
        return (
            <PageWrapper>
                <Header />

     
                <Main style={{ display: 'block', maxWidth: '48rem', margin: '0 auto' }}>
                    <Content style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h1>Group Not Found</h1>
                        <p>We couldn't find the Scout group you're looking for. Please check the link or contact your Scout leader.</p>
                        <Link to="/">Return to Home</Link>
                    </Content>
                </Main>
                <Footer />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <Header />

            {submitted && matchingParent && (
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        boxSizing: 'border-box',
                        maxWidth: '72rem',
                        margin: '0 auto',
                        padding: '0.5rem 1rem',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.875rem',
                            color: '#0F5BA4',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        Logged in as: {matchingParent.name}
                    </span>
                </div>
            )}

            <Main style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                {!submitted && (
                    <LogoWrapper>
                        <img src={logo} alt="ScoutBase Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
                    </LogoWrapper>
                )}

                <Content style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.25rem' }}>
                        {groupName ? `${groupName}` : 'Scout Group'}
                    </h1>
                    <h1 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.25rem' }}>
                        Sign In / Out
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
                                    style={{ width: '100%', maxWidth: '300px', margin: '0 auto 1rem', padding: '0.5rem' }}
                                />
                                <input
                                    type="password"
                                    placeholder="Enter 4-digit PIN"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    style={{ width: '100%', maxWidth: '300px', margin: '0 auto 1rem', padding: '0.5rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                                    <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                                        Continue
                                    </button>
                                </div>
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

                                </div>
                            )}

                            {!selectedMember ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                    {filteredYouthList.map((m) => {
                                        const latest = latestStatusMap[m.id];
                                        return (
                                            <div key={m.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                                                <button
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.75rem 1rem',
                                                        fontWeight: '600',
                                                        borderRadius: '6px',
                                                        backgroundColor: '#ffffff',
                                                        border: '1px solid #d1d5db',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setSelectedMember(m)}
                                                >
                                                    <div>
                                                        <div>{m.name}</div>
                                                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{m.section}</div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        color: latest?.action === 'signed in' ? '#10b981' : '#ef4444',
                                                        fontWeight: 'bold',
                                                        textAlign: 'right'
                                                    }}>
                                                        {latest
                                                            ? `${latest.action} at ${new Date(latest.timestamp).toLocaleString('en-AU', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}`
                                                            : 'Not signed in'}
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
                                        latestStatus={latestStatusMap[selectedMember.id] || null}
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
                </Content>
            </Main>

            <Footer />
        </PageWrapper>
    );
}
