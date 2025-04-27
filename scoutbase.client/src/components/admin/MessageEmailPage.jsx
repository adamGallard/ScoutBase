import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sections } from '@/components/common/Lookups.js';
import {
    PageWrapper,
    PageTitle,
    PrimaryButton,
    CompactSelect,
} from '@/components/common/SharedStyles';

export default function MessageParentsEmailPage({ groupId }) {
    const [sectionFilter, setSectionFilter] = useState('');
    const [parentsList, setParentsList] = useState([]);
    const [selectedParents, setSelectedParents] = useState([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [mode, setMode] = useState('direct'); // 'direct' | 'client'
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // load primary-contact parents & their emails
    useEffect(() => {
        if (!groupId) return;
        setLoading(true);
        (async () => {
            let query = supabase
                .from('parent_youth')
                .select(`
          parent:parent_id (
            id,
            name,
            email,
            group_id
          ),
          youth:youth_id (
            section
          )
        `)
                .eq('is_primary', true)
                .eq('parent.group_id', groupId);

            if (sectionFilter) {
                query = query.eq('youth.section', sectionFilter);
            }

            const { data, error } = await query.order('name', {
                foreignTable: 'parent',
                ascending: true,
            });
            setLoading(false);
            if (error) {
                console.error('Error fetching parents:', error);
                return;
            }

            // dedupe by parent.id
            const dedup = {};
            (data || []).forEach(r => {
                const p = r.parent;
                const sec = r.youth?.section ?? '';
                dedup[p.id] = { ...p, section: sec };
            });
            setParentsList(
                Object.values(dedup).sort((a, b) => a.name.localeCompare(b.name))
            );
        })();
    }, [groupId, sectionFilter]);

    const toggleParent = id =>
        setSelectedParents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    const handleSelectAll = () =>
        setSelectedParents(prev =>
            prev.length === parentsList.length
                ? []
                : parentsList.map(p => p.id)
        );

    const handleSend = async () => {
        if (!subject || !body || !selectedParents.length) return;
        const toList = parentsList
            .filter(p => selectedParents.includes(p.id))
            .map(p => p.email)
            .filter(e => !!e);

        if (!toList.length) {
            return alert('No valid email addresses selected.');
        }

        if (mode === 'direct') {
            setSending(true);
            try {
                const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: toList,
                        subject,
                        message: body,
                    }),
                });
                if (!res.ok) throw new Error(await res.text());
                alert('Emails sent successfully!');
            } catch (err) {
                console.error('Email send error:', err);
                alert(`Error: ${err.message}`);
            } finally {
                setSending(false);
            }
        } else {
            // mailto: with comma-separated recipients
            const mailto = [
                `mailto:?bcc=${encodeURIComponent(toList.join(','))}`,
                `subject=${encodeURIComponent(subject)}`,
                `body=${encodeURIComponent(body)}`,
            ].join('?');
            window.location.href = mailto;
        }
    };

    const codeToSectionLabel = code =>
        sections.find(s => s.code === code)?.label ?? code;

    return (
        <PageWrapper>
            <PageTitle>📧 Email Parents</PageTitle>

            <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
                <label>
                    Section:
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

                <div>
                    <label style={{ marginRight: '1rem' }}>
                        <input
                            type="radio"
                            checked={mode === 'direct'}
                            onChange={() => setMode('direct')}
                        />{' '}
                        Send direct
                    </label>
                    <label>
                        <input
                            type="radio"
                            checked={mode === 'client'}
                            onChange={() => setMode('client')}
                        />{' '}
                        Open Mail
                    </label>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Left: compose */}
                <div style={{ flex: '1 1 40%' }}>
                    <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                        }}
                    />
                    <textarea
                        rows={8}
                        placeholder="Write your email here…"
                        value={body}
                        onChange={e => setBody(e.target.value)}
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
                        disabled={
                            sending ||
                            !subject ||
                            !body ||
                            selectedParents.length === 0
                        }
                        style={{ marginTop: '0.5rem' }}
                    >
                        {sending
                            ? 'Sending…'
                            : `Send to ${selectedParents.length} Parent(s)`}
                    </PrimaryButton>
                </div>

                {/* Right: parent list */}
                <div
                    style={{
                        flex: '1 1 60%',
                        maxHeight: 600,
                        overflowY: 'auto',
                    }}
                >
                    <PrimaryButton
                        onClick={handleSelectAll}
                        style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.9rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {selectedParents.length === parentsList.length
                            ? 'Deselect All'
                            : 'Select All'}
                    </PrimaryButton>
                    {loading ? (
                        <p>Loading parents…</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {parentsList.length ? (
                                parentsList.map(p => (
                                    <li key={p.id} style={{ marginBottom: 8 }}>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedParents.includes(p.id)}
                                                onChange={() => toggleParent(p.id)}
                                            />
                                            <span>
                                                {p.name} (
                                                {codeToSectionLabel(p.section)}) – {p.email}
                                            </span>
                                        </label>
                                    </li>
                                ))
                            ) : (
                                <p>No primary-contact parents found.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
