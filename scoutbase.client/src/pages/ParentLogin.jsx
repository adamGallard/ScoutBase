// src/pages/ParentLogin.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { fetchGroupBySlug } from '@/helpers/groupHelper';
import { useIsMobile } from '@/hooks/useIsMobile';
import { supabase } from '@/lib/supabaseClient'; // <- ensure this is your client
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

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function ParentLogin() {
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
    const [searchTerm, setSearchTerm] = useState('');
    const [showForgottenPinModal, setShowForgottenPinModal] = useState(false);
    const [primaryLeaderEmail, setPrimaryLeaderEmail] = useState(null);
    const [forgottenPinName, setForgottenPinName] = useState('');
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

    // load group from slug
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

    // NEW: handle secure token-based login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!groupId) return;

        try {
            const res = await fetch(`${API_BASE}/api/loginParent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: searchTerm,
                    enteredPin: pin,
                    groupId,
                }),
            });

            const { token, parent, error: loginError } = await res.json();

            if (!res.ok || !token || !parent) {
                setError(loginError || 'Login failed');
                return;
            }

            // Supabase expects a refresh_token, even if it's an empty string
            await supabase.auth.setSession({ access_token: token, refresh_token: '' });

            // Store parent info and groupId in sessionStorage so wrapper can access it
            sessionStorage.setItem(
                'parentInfo',
                JSON.stringify({ parent, groupId })
            );

            navigate(
                {
                    pathname: '/parent',
                    search: `?group=${groupSlug}`,
                }
                // no state needed, since sessionStorage is used
            );
        } catch (err) {
            console.error('Login error:', err);
            setError('Something went wrong. Please try again.');
        }
    };

    if (loadingGroup) {
        return (
            <PageWrapper>
                <Header />
                <Main style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Content style={{ padding: isMobile ? '1rem' : '2rem', textAlign: 'center' }}>
                        <p>Loading group…</p>
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
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}
                >
                    <input
                        type="text"
                        placeholder="Enter parent name or phone"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '90%',
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            marginBottom: '1rem',
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
                        zIndex: 1000,
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
                            fontFamily: 'sans-serif',
                        }}
                    >
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Need Help with Your PIN?</h3>
                        <p style={{ marginBottom: '1rem' }}>
                            If you’ve forgotten your PIN,
                            enter your name and click <strong>Email Leader</strong> to request a PIN reset.
                        </p>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={forgottenPinName}
                            onChange={(e) => setForgottenPinName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '1rem',
                                marginBottom: '1rem',
                                border: '1px solid #ccc',
                                borderRadius: '6px',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <a
                                href={
                                    primaryLeaderEmail && forgottenPinName
                                        ? `mailto:${primaryLeaderEmail}?subject=Forgotten PIN - ${encodeURIComponent(
                                            forgottenPinName
                                        )}&body=Hi leader,%0D%0A%0D%0AI've forgotten my PIN. Could you help me reset it?%0D%0A%0D%0AThanks!`
                                        : undefined
                                }
                                onClick={() => {
                                    if (forgottenPinName) {
                                        setTimeout(() => {
                                            setShowForgottenPinModal(false);
                                        }, 500);
                                    }
                                }}
                                style={{
                                    backgroundColor: forgottenPinName ? '#0F5BA4' : '#999',
                                    color: '#fff',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    pointerEvents: forgottenPinName ? 'auto' : 'none',
                                    opacity: forgottenPinName ? 1 : 0.6,
                                }}
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
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </PageWrapper>
    );
}
