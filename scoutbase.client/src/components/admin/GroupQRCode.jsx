import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { PageTitle, Select, PrimaryButton, AdminTable } from '@/components/common/SharedStyles';
import { QrCode } from 'lucide-react';
export default function GroupQRCode({ groupStub }) {
    const qrUrl = `https://scoutbase.app/sign-in?group=${encodeURIComponent(groupStub)}`;

    return (
        <div className="content-box">
            <PageTitle>
                <QrCode size={24} style={{ marginRight: 8 }} />
                Sign-In QR Code
            </PageTitle>
        <div style={{ textAlign: 'center', padding: '1rem' }}>

            <p>Scan to sign in for <strong>{groupStub}</strong></p>
            <div style={{ background: 'white', padding: '1rem', display: 'inline-block' }}>
                <QRCode value={qrUrl} size={200} />
            </div>
            <p style={{ marginTop: '1rem', wordBreak: 'break-all' }}>{qrUrl}</p>
            </div>
        </div>
    );
}
