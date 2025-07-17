import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { PageTitle, PrimaryButton } from '@/components/common/SharedStyles';
import { QrCode } from 'lucide-react';

export default function GroupQRCode({ groupStub }) {
    const [selected, setSelected] = useState('signin');

    const qrOptions = {
        signin: {
            label: 'Parent Sign-In',
            description: `Scan to sign in for your group (${groupStub})`,
            url: `https://scoutbase.app/sign-in?group=${encodeURIComponent(groupStub)}`
        },
        family: {
            label: 'Family Registration',
            description: `Scan to register your family for group (${groupStub})`,
            url: `https://scoutbase.app/signup?group=${encodeURIComponent(groupStub)}`
        }
    };

    const current = qrOptions[selected];

    return (
        <div className="content-box">
            <PageTitle>
                <QrCode size={24} style={{ marginRight: 8 }} />
                Group QR Codes
            </PageTitle>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
                <button
                    className={`qr-tab${selected === 'signin' ? ' active' : ''}`}
                    onClick={() => setSelected('signin')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '8px 0 0 8px',
                        border: '1px solid #0F5BA4',
                        borderRight: 'none',
                        background: selected === 'signin' ? '#0F5BA4' : '#fff',
                        color: selected === 'signin' ? '#fff' : '#0F5BA4',
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: 'pointer'
                    }}
                >
                    Sign-In
                </button>
                <button
                    className={`qr-tab${selected === 'family' ? ' active' : ''}`}
                    onClick={() => setSelected('family')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '0 8px 8px 0',
                        border: '1px solid #0F5BA4',
                        background: selected === 'family' ? '#0F5BA4' : '#fff',
                        color: selected === 'family' ? '#fff' : '#0F5BA4',
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: 'pointer'
                    }}
                >
                    Family Registration
                </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <h3 style={{ marginBottom: 8 }}>{current.label}</h3>
                <p style={{ marginBottom: 20 }}>{current.description}</p>
                <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: 8 }}>
                    <QRCode value={current.url} size={300} />
                </div>
                <p style={{ marginTop: '1rem', wordBreak: 'break-all', fontSize: 13 }}>{current.url}</p>
            </div>
        </div>
    );
}
