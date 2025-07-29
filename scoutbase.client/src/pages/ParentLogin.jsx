import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { fetchGroupBySlug } from '@/helpers/groupHelper';
import { useIsMobile } from '@/hooks/useIsMobile';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Logo from '@/assets/scoutbase-logo.svg';
import {
    PageWrapper,
    Content,
    PageTitle,
    AdminInput,
    PrimaryButton,
    LogoWrapper,
    Main,
} from '@/components/common/SharedStyles';
import { useParentSession } from '@/helpers/SessionContext';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ParentLogin() {
    const { login, session, loading: sessionLoading } = useParentSession();
    const query = useQuery();
    const groupSlug = query.get('group');
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [groupNotFound, setGroupNotFound] = useState(false);
    const [error, setError] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [pin, setPin] = useState('');
    const [showForgottenPinModal, setShowForgottenPinModal] = useState(false);
    const [primaryLeaderEmail, setPrimaryLeaderEmail] = useState(null);
    const [forgottenPinName, setForgottenPinName] = useState('');
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    // Efficient: Avoid showing login if already authenticated
    useEffect(() => {
        if (!sessionLoading && session?.token && session?.parent && session?.groupId) {
            navigate({
                pathname: '/parent',
                search: `?group=${groupSlug}`,
            }, { replace: true });
        }
    }, [session, sessionLoading, navigate, groupSlug]);

    // Load group from slug
    useEffect(() => {
        (async () => {
            if (!groupSlug) {
                setGroupNotFound(true);
                setLoadingGroup(false);
                return;
            }
            const { data, error } = await fetchGroupBySlug(groupSlug);
            if (error || !data?.active) {
                setGroupNotFound(true);
            } else {
                setGroupId(data.id);
                setGroupName(data.name);
            }
            setLoadingGroup(false);
        })();
    }, [groupSlug]);

    // Handle login securely
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!groupId) return;

        // Input validation: prevent empty fields
        if (!identifier.trim() || !pin.trim()) {
            setError('Both name/phone and PIN are required.');
            return;
        }

        try {
            const res = await fetch('/api/loginParent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, enteredPin: pin, groupId }),
            });
            const data = await res.json();
            const { token, parent, error: loginError } = data;

            if (!res.ok || !token || !parent) {
                setError(loginError || 'Login failed');
                setPin(''); // Clear incorrect PIN
                return;
            }

            await login({ token, parent, groupId });

            navigate({
                pathname: '/parent',
                search: `?group=${groupSlug}`,
            }, { replace: true });
        } catch (err) {
            // Security: generic error message, avoid leaking info
            setError('Something went wrong. Please try again.');
        }
    };

    if (loadingGroup || sessionLoading) {
        return (
            <PageWrapper>
                <Header />
                <Main style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Content style={{ padding: isMobile ? '1rem' : '2rem', textAlign: 'center' }}>
                        <p>Loading…</p>
                    </Content>
                </Main>
                <Footer />
            </PageWrapper>
        );
    }

    if (groupNotFound) {
        return (
            <PageWrapper>
                <Header />
                <Main style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Content style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <LogoWrapper style={{ width: 150, height: 150 }}>
                            <img src={Logo} alt="ScoutBase Logo" style={{ width: 120, objectFit: 'contain' }} />
                        </LogoWrapper>
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
            <Content
                style={{
                    maxWidth: isMobile ? '90%' : 600,
                    width: '100%',
                    margin: '0 auto',
                    padding: isMobile ? '1rem' : '2rem',
                    textAlign: 'center',
                }}
            >
                <LogoWrapper style={{ width: 150, height: 150 }}>
                    <img src={Logo} alt="ScoutBase Logo" style={{ width: 120, objectFit: 'contain' }} />
                </LogoWrapper>

                <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{groupName || 'Scout Group'}</h1>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Sign In</h2>

                <p>Please enter your name and PIN to sign in and view the youth members linked to your account.</p>
                <form
                    onSubmit={handleSubmit}
                    autoComplete="on"
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}
                >
                    <input
                        type="text"
                        placeholder="Enter parent name or phone"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        style={{
                            width: '90%',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            marginBottom: '1rem',
                        }}
                        autoFocus
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter 4-digit PIN"
                        autoComplete="current-password"
                        value={pin}
                        maxLength={4}
                        onChange={(e) => setPin(e.target.value)}
                        style={{
                            width: '90%',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            marginBottom: '1rem',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <PrimaryButton type="submit" isMobile={isMobile}>
                            Continue
                        </PrimaryButton>
                    </div>
                    {error && (
                        <p
                            style={{
                                color: 'red',
                                marginTop: '0.5rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                maxWidth: '100%',
                            }}
                        >
                            {error}
                        </p>
                    )}

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
                            marginTop: '2rem',
                        }}
                    >
                        Forgotten your PIN?
                    </button>
                </form>
            </Content>
            {/* Forgotten PIN modal code stays the same */}
            <Footer />
        </PageWrapper>
    );
}
