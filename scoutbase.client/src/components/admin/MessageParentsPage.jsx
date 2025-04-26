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

const codeToSectionLabel = code =>
    sections.find(s => s.code === code)?.label ?? code;

export default function MessageParentsPage({ groupId }) {
    const [sectionFilter, setSectionFilter] = useState('');
    const [parentsList, setParentsList] = useState([]);
    const [selectedParents, setSelectedParents] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

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
            phone,
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
                ascending: true
            });

            setLoading(false);
            if (error) {
                console.error('Error fetching parents:', error);
                return;
            }

                  const dedup = {};
                  (data || []).forEach(r => {
                        const p = r.parent;
                        // some rows may lack the youth relation—safely default to empty
                            const sec = r.youth?.section ?? '';
                        dedup[p.id] = { ...p, section: sec };
             });
          // alphabetical by parent name
              const sortedParents = Object.values(dedup)
                   .sort((a, b) => a.name.localeCompare(b.name));
          setParentsList(sortedParents);
        })();
    }, [groupId, sectionFilter]);

    const toggleParent = id =>
        setSelectedParents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const handleSelectAll = () => {
        if (selectedParents.length === parentsList.length) {
            setSelectedParents([]);
        } else {
            setSelectedParents(parentsList.map(p => p.id));
        }
    };

    const handleSend = async () => {
        if (!message || selectedParents.length === 0) return;
        setSending(true);

        const toNums = parentsList
            .filter(p => selectedParents.includes(p.id))
            .map(p => p.phone);

        await Promise.all(
            toNums.map(to =>
                supabase.functions.invoke('send-sms', {
                    body: { to, body: message }
                })
            )
        );

        setSending(false);
        alert('Messages sent!');
    };

    return (
        <PageWrapper>
            <PageTitle>📨 Send SMS to Parents</PageTitle>

            <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label>
                    Section:
                    <CompactSelect
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value)}
                        style={{ marginLeft: '0.5rem' }}
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
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            resize: 'vertical'
                        }}
                    />
                    <PrimaryButton
                        onClick={handleSend}
                        disabled={sending || !message || selectedParents.length === 0}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {sending ? 'Sending…' : `Send to ${selectedParents.length} Parent(s)`}
                    </PrimaryButton>
                </div>

                {/* Right: parents list + select all */}
                <div style={{ flex: '1 1 60%', maxHeight: '600px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <PrimaryButton
                            onClick={handleSelectAll}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                        >
                            {selectedParents.length === parentsList.length ? 'Deselect All' : 'Select All'}
                        </PrimaryButton>
                    </div>

                    {loading ? (
                        <p>Loading parents…</p>
                    ) : (
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {parentsList.map(parent => (
                                <li key={parent.id} style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedParents.includes(parent.id)}
                                            onChange={() => toggleParent(parent.id)}
                                        />
                                        <span>
                                            {parent.name} ({codeToSectionLabel(parent.section)}) – {parent.phone}
                                        </span>
                                    </label>
                                </li>
                            ))}
                            {parentsList.length === 0 && <p>No primary-contact parents found.</p>}
                        </ul>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
