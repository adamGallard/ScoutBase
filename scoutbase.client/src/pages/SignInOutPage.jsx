﻿import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/scoutbase-logo.svg';

import { fetchGroupBySlug, fetchPrimaryLeaderEmail } from '../helpers/groupHelper';
import {
    fetchYouthByParentId,
    fetchLatestAttendanceForYouthList
} from '../helpers/attendanceHelper';
import { verifyParentByIdentifierAndPin } from '../helpers/authHelper';

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
import UpdatePinModal from '../components/UpdatePinModal';
import { useIsMobile } from '../hooks/useIsMobile';

const useQuery = () => new URLSearchParams(useLocation().search);

export default function SignInOutPage() {
    const query = useQuery();
    const groupSlug = query.get('group');
    const isMobile = useIsMobile();

    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [groupNotFound, setGroupNotFound] = useState(false);

    const [selectedMember, setSelectedMember] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [youthList, setYouthList] = useState([]);
    const [latestStatusMap, setLatestStatusMap] = useState({});
    const [sectionFilter, setSectionFilter] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [pin, setPin] = useState('');
    const [matchingParent, setMatchingParent] = useState(null);
    const [parentName, setParentName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showUpdatePinModal, setShowUpdatePinModal] = useState(false);
    const [showForgottenPinModal, setShowForgottenPinModal] = useState(false);
    const [primaryLeaderEmail, setPrimaryLeaderEmail] = useState(null);
    const filteredYouthList = youthList.filter(
        (m) => sectionFilter === '' || m.section === sectionFilter
    );

    useEffect(() => {
        const loadGroup = async () => {
            const { data, error } = await fetchGroupBySlug(groupSlug);
            if (data) {
                if (!data.active) {
                    setGroupNotFound(true);
                    return;
                }
                setGroupId(data.id);
                setGroupName(data.name);

                const email = await fetchPrimaryLeaderEmail(data.id);
                setPrimaryLeaderEmail(email);
            } else {
                setGroupNotFound(true);
            }
        };
        if (groupSlug) loadGroup();
    }, [groupSlug]);

    const handleSign = async (memberId, data) => {
        const { comment, timestamp, action, group_id } = data;

        const eventDate = timestamp.split('T')[0]; // YYYY-MM-DD
        const signedBy = matchingParent?.name || 'Unknown'; // fallback

        const { error } = await supabase.from('attendance').insert([
            {
                youth_id: memberId,
                group_id,
                action,
                comment,
                timestamp,
                event_date: eventDate,
                signed_by: signedBy,
            }
        ]);

        if (error) {
            console.error('❌ Error saving attendance:', error);
            alert('Failed to save attendance record.');
            return;
        }

        const newStatusMap = await fetchLatestAttendanceForYouthList(supabase, youthList, groupId);
        setLatestStatusMap(newStatusMap);
        setSelectedMember(null);
    };

    const handleSearch = async () => {
        setError('');
        const { success, parent, error: verifyError } = await verifyParentByIdentifierAndPin(searchTerm, pin, groupId);

        if (!success) {
            setError(verifyError);
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
                <Main style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Content style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h1>Group Not Found</h1>
                        <p>We couldn't find the Scout group you're looking for.</p>
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
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        maxWidth: '500px',
                        margin: '0 auto',
                        padding: '0.5rem 1rem',
                        boxSizing: 'border-box'
                    }}
                >
                    <span style={{ fontSize: '0.875rem', color: '#0F5BA4', fontWeight: 600 }}>
                        Logged in as: {matchingParent.name}
                    </span>
                    <button
                        style={{
                            fontSize: isMobile ? '0.875rem' : '0.75rem',
                            backgroundColor: '#0F5BA4',
                            color: '#fff',
                            borderRadius: '4px',
                            padding: isMobile ? '8px 12px' : '4px 8px',
                            fontWeight: 500
                        }}
                        onClick={() => setShowUpdatePinModal(true)}
                    >
                        Update PIN
                    </button>
                </div>
            )}

            <Main style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                <Content
                    style={{
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        padding: isMobile ? '1rem' : '2rem',
                        boxSizing: 'border-box'
                    }}
                >
                    {!submitted && (
                        <LogoWrapper>
                            <img src={logo} alt="ScoutBase Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
                        </LogoWrapper>
                    )}

                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{groupName || 'Scout Group'}</h1>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Sign In / Out</h2>
                    <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#333' }}>
                        Enter your name to see the youth members linked to you.
                    </p>

                    {!submitted ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                            <input
                                type="text"
                                placeholder="Enter parent name or phone"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '0.75rem' : '0.5rem',
                                    fontSize: isMobile ? '1rem' : '0.875rem',
                                    marginBottom: '1rem'
                                }}
                            />
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter 4-digit PIN"
                                value={pin}
                                maxLength={4}
                                onChange={(e) => setPin(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '0.75rem' : '0.5rem',
                                    fontSize: isMobile ? '1rem' : '0.875rem',
                                    marginBottom: '1rem'
                                }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <button
                                    type="submit"
                                    style={{
                                        padding: isMobile ? '0.75rem' : '0.5rem',
                                        fontSize: isMobile ? '1rem' : '0.875rem',
                                        backgroundColor: '#0F5BA4',
                                        color: '#fff',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        border: 'none',
                                        width: isMobile ? '100%' : 'auto',
                                    }}
                                >
                                    Continue
                                </button>
                            </div>
                            {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

                            <button
                                type="button"
                                onClick={() => setShowForgottenPinModal(true)}
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#0F5BA4',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    marginTop: '2rem'
                                }}
                            >
                                Forgotten your PIN?
                            </button>

                        </form>
                    ) : (
                        <>
                                {loading && <p>Loading Youth...</p>}

                                {!selectedMember ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <div style={{ width: '100%' }}>
                                            <label htmlFor="sectionFilter" style={{ fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                                                Filter by section:
                                            </label>
                                            <select
                                                id="sectionFilter"
                                                value={sectionFilter}
                                                onChange={(e) => setSectionFilter(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: isMobile ? '0.75rem' : '0.5rem',
                                                    fontSize: isMobile ? '1rem' : '0.875rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ccc',
                                                }}
                                            >
                                                <option value="">All</option>
                                                <option value="Joeys">Joeys</option>
                                                <option value="Cubs">Cubs</option>
                                                <option value="Scouts">Scouts</option>
                                                <option value="Venturers">Venturers</option>
                                            </select>
                                        </div>

                                        {filteredYouthList.map((m) => {
                                            const latest = latestStatusMap[m.id];
                                            return (
                                                <div
                                                    key={m.id}
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: '500px',
                                                        background: '#fff',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '8px',
                                                        padding: '1rem',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => setSelectedMember(m)}
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            textAlign: 'left',
                                                            cursor: 'pointer',
                                                            fontSize: isMobile ? '1rem' : '0.95rem',
                                                        }}
                                                    >
                                                        <div>
                                                            <div>{m.name}</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{m.section}</div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                color: latest?.action === 'signed in' ? '#10b981' : '#ef4444',
                                                                fontWeight: 'bold',
                                                                textAlign: 'right',
                                                            }}
                                                        >
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

                                        <button
                                            style={{
                                                marginTop: '1rem',
                                                fontSize: isMobile ? '1rem' : '0.875rem',
                                                padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
                                                backgroundColor: '#0F5BA4',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                            }}
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
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                                        <SignInForm
                                            member={selectedMember}
                                            parentName={parentName}
                                            onSign={handleSign}
                                            latestStatus={latestStatusMap[selectedMember.id] || null}
                                            groupId={groupId}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setSelectedMember(null)}
                                                style={{
                                                    marginTop: '12px',
                                                    fontSize: isMobile ? '1rem' : '0.875rem',
                                                    padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
                                                    backgroundColor: '#ccc',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                }}
                                            >
                                                Back
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </>
                    )}
                </Content>
            </Main>

            {showUpdatePinModal && matchingParent && (
                <UpdatePinModal
                    isOpen={true}
                    onClose={() => setShowUpdatePinModal(false)}
                    parentId={matchingParent.id}
                />
            )}
            {showForgottenPinModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            padding: '2rem',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '400px',
                            textAlign: 'center',
                            fontFamily: 'sans-serif'
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Need Help with Your PIN?</h3>
                        <p style={{ marginBottom: '1.5rem' }}>
                            If you’ve forgotten your PIN, please contact your Scout Leader for assistance.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <a
                                href={
                                    primaryLeaderEmail
                                        ? `mailto:${primaryLeaderEmail}?subject=Forgotten PIN Help&body=Hi leader,%0D%0A%0D%0AI've forgotten my PIN. Could you help me reset it?%0D%0A%0D%0AThanks!`
                                        : undefined
                                }
                                style={{
                                    backgroundColor: '#0F5BA4',
                                    color: '#fff',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    textDecoration: 'none'
                                }}
                                disabled={!primaryLeaderEmail}
                            >
                                Email Leader
                            </a>
                            <button
                                onClick={() => setShowForgottenPinModal(false)}
                                style={{
                                    backgroundColor: '#ccc',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <Footer />
        </PageWrapper>
    );
}
