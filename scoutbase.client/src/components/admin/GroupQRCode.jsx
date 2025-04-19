import React, { useRef } from 'react';
import QRCode from 'react-qr-code';


export default function GroupQRCode({ groupStub }) {
    const qrUrl = `https://scoutbase.app/sign-in?group=${encodeURIComponent(groupStub)}`;

    return (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h3>Sign-In QR Code</h3>
            <p>Scan to sign in for <strong>{groupStub}</strong></p>
            <div style={{ background: 'white', padding: '1rem', display: 'inline-block' }}>
                <QRCode value={qrUrl} size={200} />
            </div>
            <p style={{ marginTop: '1rem', wordBreak: 'break-all' }}>{qrUrl}</p>
        </div>
    );
}
