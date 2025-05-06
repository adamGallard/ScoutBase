// src/components/admin/MessageParentsPage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sections } from '@/components/common/Lookups.js';
import {
    PageWrapper,
    PageTitle,
    PrimaryButton,
    CompactSelect,
} from '@/components/common/SharedStyles';
import { MessageCircle } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

const toE164 = raw => {
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '61' + digits.slice(1); // AU → +61 …
    return '+' + digits;
};
const isE164 = num => /^\+[1-9]\d{1,14}$/.test(num);

/* ────────────────────────────────────────────────────────────────────────── */

export default function MessageParentsPage({ groupId }) {
    /* 0. Mode = loading | off | nodetails | ready */
    const [mode, setMode] = useState('loading');

    /* 1. UI state */
    const [sectionFilter, setSectionFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [parentsList, setParentsList] = useState([]);
    const [selectedParents, setSelectedParents] = useState([]);
    const [message, setMessage] = useState('');

    const [loadingParents, setLoadingParents] = useState(false);
    const [sending, setSending] = useState(false);

    /* ──────────────────────────────────────────────────────────────────────── */
    /* 1. Fetch SMS toggle + Twilio settings                                   */
    /* ──────────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!groupId) return;

        (async () => {
            const { data, error } = await supabase
                .from('group_settings')
                .select(
                    `
            sms_enabled,
            twilio_account_sid,
            twilio_auth_token,
            twilio_messaging_service_sid
          `
                )
                .eq('group_id', groupId)
                .single();

            if (error) {
                console.error('Error fetching SMS settings:', error);
                setMode('off');
                return;
            }

            const {
                sms_enabled,
                twilio_account_sid,
                twilio_auth_token,
                twilio_messaging_service_sid,
            } = data;

            if (!sms_enabled) {
                setMode('off');
            } else if (
                !twilio_account_sid ||
                !twilio_auth_token ||
                !twilio_messaging_service_sid
            ) {
                setMode('nodetails');
            } else {
                setMode('ready');
            }
        })();
    }, [groupId]);

    /* ──────────────────────────────────────────────────────────────────────── */
    /* 2. Fetch parents only when SMS is usable                                */
    /* ──────────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (mode !== 'ready' || !groupId) return;

        setLoadingParents(true);

        (async () => {
            const { data, error } = await supabase
                .from('parent_youth')
                .select(`
          parent:parent_id (
            id,
            name,
            phone,
            group_id
          ),
          youth:youth_id (
            section,
            linking_section
          )
        `)
                .eq('is_primary', true)
                .eq('parent.group_id', groupId)
                .order('name', { foreignTable: 'parent', ascending: true });

            setLoadingParents(false);
            if (error) {
                console.error('Error fetching parents:', error);
                return;
            }

            /* De‑dupe parents, combine section + linking_section */
            const dedup = {};
            data.forEach(r => {
                const p = r.parent;
                const sec1 = r.youth?.section ?? '';
                const sec2 = r.youth?.linking_section ?? '';
                if (!dedup[p.id]) dedup[p.id] = { ...p, sections: [] };
                if (sec1 && !dedup[p.id].sections.includes(sec1))
                    dedup[p.id].sections.push(sec1);
                if (sec2 && !dedup[p.id].sections.includes(sec2))
                    dedup[p.id].sections.push(sec2);
            });

            setParentsList(
                Object.values(dedup).sort((a, b) => a.name.localeCompare(b.name))
            );
        })();
    }, [groupId, mode]);

    /* ──────────────────────────────────────────────────────────────────────── */
    /* 3. Derived lists & helpers                                              */
    /* ──────────────────────────────────────────────────────────────────────── */
    const displayedParents = parentsList.filter(
        p =>
            (!sectionFilter || p.sections.includes(sectionFilter)) &&
            p.name.toLowerCase().includes(nameFilter.toLowerCase())
    );

    const toggleParent = id =>
        setSelectedParents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const handleSelectAll = () => {
        if (selectedParents.length === displayedParents.length)
            setSelectedParents([]);
        else setSelectedParents(displayedParents.map(p => p.id));
    };

    const handleSend = async () => {
        if (!message || selectedParents.length === 0) return;

        const toNums = displayedParents
            .filter(p => selectedParents.includes(p.id))
            .map(p => toE164(p.phone))
            .filter(isE164);

        if (toNums.length === 0) {
            alert('No valid phone numbers to send.');
            return;
        }

        setSending(true);
        try {
            await Promise.all(
                toNums.map(to =>
                    fetch('/api/send-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to, body: message }),
                    }).then(res => {
                        if (!res.ok) throw new Error(`Failed to send to ${to}`);
                    })
                )
            );
            alert('Messages sent successfully!');
            setMessage('');
            setSelectedParents([]);
        } catch (err) {
            console.error('SMS send error:', err);
            alert(`Error sending SMS: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    /* ──────────────────────────────────────────────────────────────────────── */
    /* 4. Render by mode                                                       */
    /* ──────────────────────────────────────────────────────────────────────── */
    if (mode === 'loading') return null; // or a spinner

    if (mode === 'off')
        return (
            <PageWrapper>
                <PageTitle>
                    <MessageCircle
                        size={25}
                        style={{ marginRight: 8, verticalAlign: 'middle' }}
                    />
                    Send SMS to Parents
                </PageTitle>
                <p style={{ color: '#b52d2d', fontSize: '1.1rem' }}>
                    SMS messaging is currently <strong>disabled</strong> for this group.
                    Please ask your Group Leader to enable it in Settings.
                </p>
            </PageWrapper>
        );

    if (mode === 'nodetails')
        return (
            <PageWrapper>
                <PageTitle>
                    <MessageCircle
                        size={25}
                        style={{ marginRight: 8, verticalAlign: 'middle' }}
                    />
                    Send SMS to Parents
                </PageTitle>
                <p style={{ color: '#b52d2d', fontSize: '1.1rem' }}>
                    SMS is enabled, but the Twilio configuration is incomplete. Add your
                    <em> Account SID</em>, <em>Auth Token</em>, and
                    <em> Messaging Service SID</em> in Settings.
                </p>
            </PageWrapper>
        );

    /* mode === 'ready' → full UI */
    return (
        <PageWrapper>
            <PageTitle>
                <MessageCircle
                    size={25}
                    style={{ marginRight: 8, verticalAlign: 'middle' }}
                />
                Send SMS to Parents
            </PageTitle>

            <section id="sms-page-instructions">
                <p>
                    <strong>Send a text message to parents.</strong> Filter by section or
                    name, tick recipients, type your message, then click&nbsp;
                    <code>Send</code> to deliver via SMS.
                </p>
            </section>

            {/* Section filter */}
            <div
                style={{
                    margin: '1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                }}
            >
                <label>
                    Section:&nbsp;
                    <CompactSelect
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value)}
                        style={{ marginLeft: 8 }}
                    >
                        <option value="">All</option>
                        {sections
                            .sort((a, b) => a.order - b.order)
                            .map(({ code, label }) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                    </CompactSelect>
                </label>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Left: message + send */}
                <div style={{ flex: '1 1 40%' }}>
                    <textarea
                        rows={8}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your message here…"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            resize: 'vertical',
                        }}
                    />
                    <PrimaryButton
                        onClick={handleSend}
                        disabled={sending || !message || !selectedParents.length}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {sending
                            ? 'Sending…'
                            : `Send to ${selectedParents.length} Parent(s)`}
                    </PrimaryButton>
                </div>

                {/* Right: parent list + filters + select all */}
                <div style={{ flex: '1 1 60%', maxHeight: 600, overflowY: 'auto' }}>
                    {/* Name filter */}
                    <input
                        type="text"
                        placeholder="Filter by name…"
                        value={nameFilter}
                        onChange={e => setNameFilter(e.target.value)}
                        style={{
                            width: '80%',
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                        }}
                    />

                    <div style={{ marginBottom: '0.5rem' }}>
                        <PrimaryButton
                            onClick={handleSelectAll}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                        >
                            {selectedParents.length === displayedParents.length
                                ? 'Deselect All'
                                : 'Select All'}
                        </PrimaryButton>
                    </div>

                    {loadingParents ? (
                        <p>Loading parents…</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {displayedParents.map(parent => (
                                <li key={parent.id} style={{ marginBottom: '0.5rem' }}>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedParents.includes(parent.id)}
                                            onChange={() => toggleParent(parent.id)}
                                        />
                                        <span>
                                            {parent.name} – {parent.phone}
                                        </span>
                                    </label>
                                </li>
                            ))}
                            {displayedParents.length === 0 && (
                                <p>No matching parents found.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
