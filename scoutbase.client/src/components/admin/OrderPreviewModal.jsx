﻿// components/BadgeOrdering/OrderPreviewModal.js
import { Mail, X } from 'lucide-react';

 export default function OrderPreviewModal({
    emailBody,
         groupName = 'Scout Group',
             leaderName = 'Scout Leader',
                 recipientEmail = '281595@scoutsqld.com.au',
                     section = 'All Sections',
                         onConfirm,           // ⭐ NEW
                         onClose
                     }) {
    /* ----- compose subject & mailto link ----- */
    const subject = `Badge Order - ${groupName} - ${section}`;
    const body = `${emailBody}\n\nYours in Scouting,\n${leaderName}\n`;
    const mailto = `mailto:${recipientEmail}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

    /* ----- ui ----- */
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', padding: '2rem', borderRadius: 8,
                maxWidth: 600, width: '90%'
            }}>
                <h2>Badge Order Preview</h2>

                <pre style={{
                    whiteSpace: 'pre-wrap', background: '#f9f9f9',
                    padding: '1rem', maxHeight: '40vh', overflow: 'auto'
                }}>{body}</pre>

                <div style={{
                    display: 'flex', justifyContent: 'flex-end',
                    gap: '1rem', marginTop: '1rem'
                }}>
                    <button onClick={onClose}>
                        <X size={16} />Cancel
                    </button>

                                        <button
                        onClick={async () => {
                                                    /* 1 ▸ write rows to badge_orders */
                                                        if (onConfirm) await onConfirm();
                            /* 2 ▸ hide the modal right away */
                             if (onClose) onClose();          // ← add this line

                            /* 3 ▸ open mail client */
                                                        window.location.href = mailto;
                        }}
                                            style={{
 background:'#2563eb', color:'#fff',
                                                padding:'0.5rem 1rem', borderRadius:6,
                                                display:'flex', alignItems:'center', gap:4
                        }}
                    >
                                            <Mail size={16} /> Submit &amp; Email
                                        </button>
                </div>
            </div>
        </div>
    );
}