import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sections } from '@/components/common/Lookups.js';
import { PageWrapper, PageTitle, PrimaryButton, CompactSelect } from '@/components/common/SharedStyles';
import 'react-quill-new/dist/quill.snow.css';
import ReactQuill from 'react-quill-new';
import { Mail } from 'lucide-react';

const quillModules = {
    toolbar: [
        [{ font: [] }, { size: [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
    ],
};

const quillFormats = [
    'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'align', 'link', 'image'
];

export default function MessageParentsEmailPage({ groupId }) {
    const [sectionFilter, setSectionFilter] = useState('');
    const [parentsList, setParentsList] = useState([]);
    const [selectedParents, setSelectedParents] = useState([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [mode, setMode] = useState('client'); // Default to 'client' mode
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [emailFilter, setEmailFilter] = useState('');

    // Email settings from the group
    const [emailingDirectEnabled, setEmailingDirectEnabled] = useState(false);
    const [emailFromClientEnabled, setEmailFromClientEnabled] = useState(false);

    // Helper to strip HTML when switching to client mode
    const stripHtml = html => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    // Fetch group settings and parents list
    useEffect(() => {
        if (!groupId) return;

        const fetchGroupSettings = async () => {
            const { data, error } = await supabase
                .from('group_settings')
                .select('emailing_direct_enabled, email_from_client_enabled')
                .eq('group_id', groupId)
                .single();

            if (error) {
                console.error('Error fetching group settings:', error);
                return;
            }

            setEmailingDirectEnabled(data.emailing_direct_enabled);
            setEmailFromClientEnabled(data.email_from_client_enabled);

            // Decide the mode
            if (data.emailing_direct_enabled && data.email_from_client_enabled) {
                // default to 'client' but let the user choose
                setMode('client');
            } else if (data.emailing_direct_enabled) {
                setMode('direct');
            } else if (data.email_from_client_enabled) {
                setMode('client');
            } else {
                setMode('none');
            }
        };

        const fetchParentsList = async () => {
            let query = supabase
                .from('parent_youth')
                .select(`parent:parent_id(id, name, email, group_id), youth:youth_id(section)`)
                .eq('is_primary', true)
                .eq('parent.group_id', groupId);

            if (sectionFilter) query = query.eq('youth.section', sectionFilter);

            const { data, error } = await query.order('name', { foreignTable: 'parent', ascending: true });

            if (error) {
                console.error('Error fetching parents:', error);
                return;
            }

            const dedup = {};
            data.forEach(r => {
                const p = r.parent;
                const sec = r.youth?.section ?? '';
                if (!dedup[p.id]) {
                    dedup[p.id] = { ...p, sections: sec ? [sec] : [] };
                } else if (sec && !dedup[p.id].sections.includes(sec)) {
                    dedup[p.id].sections.push(sec);
                }
            });

            setParentsList(Object.values(dedup).sort((a, b) => a.name.localeCompare(b.name)));
        };

        fetchGroupSettings();
        fetchParentsList();
    }, [groupId, sectionFilter]);

    // Filter displayed parents based on section filter and email filter
    const displayedParents = parentsList.filter(p =>
        (!sectionFilter || p.sections.includes(sectionFilter)) &&
        p.email.toLowerCase().includes(emailFilter.toLowerCase())
    );

    // Toggle parent selection
    const toggleParent = id =>
        setSelectedParents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    // Select or deselect all parents
    const handleSelectAll = () =>
        setSelectedParents(prev =>
            prev.length === displayedParents.length ? [] : displayedParents.map(p => p.id)
        );

    // Handle file selection
    const handleFileChange = e => {
        setAttachments(Array.from(e.target.files));
    };
	// Handle section filter change
    const handleModeChange = newMode => {
        if (newMode === mode) return;          // nothing to do

        if (newMode === 'client') {
            // going rich ➜ plain: strip the HTML
            setBody(stripHtml(body));
            setAttachments([]);
            // optional safety: clear files
        } else if (newMode === 'direct') {
            // going plain ➜ rich: turn line breaks into <br> tags
            // (Quill is fine with raw text too, but this preserves formatting)
            setBody(body.replace(/\n/g, '<br>'));
        }

        setMode(newMode);
    };


    // Handle sending emails
    const handleSend = async () => {
        if (!subject || !body || !selectedParents.length) return;
        const toList = parentsList
            .filter(p => selectedParents.includes(p.id))
            .map(p => p.email)
            .filter(e => !!e);

        if (!toList.length) return alert('No valid email addresses selected.');

        // Send email directly (if enabled)
        if (mode === 'direct' && emailingDirectEnabled) {
            setSending(true);
            try {
                const attachmentData = await Promise.all(
                    attachments.map(file =>
                        new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64 = reader.result.split(',')[1];
                                resolve({ filename: file.name, content: base64 });
                            };
                            reader.onerror = err => reject(err);
                            reader.readAsDataURL(file);
                        })
                    )
                );

                const res = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: toList,
                        subject,
                        message: body,
                        attachments: attachmentData,
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
        } else if (mode === 'client' && emailFromClientEnabled) {
            // Send via client (mailto)
            const tmp = document.createElement('div');
            tmp.innerHTML = body;
            const plainText = tmp.textContent || tmp.innerText || '';

            const bccParam = encodeURIComponent(toList.join(','));
            const subjectParam = encodeURIComponent(subject);
            const bodyParam = encodeURIComponent(plainText).replace(/%20/g, ' ').replace(/\n/g, '%0A');

            const mailto = `mailto:?bcc=${bccParam}&subject=${subjectParam}&body=${bodyParam}`;
            window.location.href = mailto;
        } else {
            alert('Emailing is disabled or no valid email address.');
        }
    };

    return (
        <div className="content-box">
            <PageTitle><Mail size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} /> Email Parents</PageTitle>

            {emailingDirectEnabled && emailFromClientEnabled && (
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ marginRight: 8 }}>
                        Send method:&nbsp;
                        <select
                            value={mode}
                            onChange={e => handleModeChange(e.target.value)}

                            style={{ padding: '0.25rem 0.5rem' }}
                        >
                            <option value="client">Open in my mail app (plain text)</option>
                            <option value="direct">Send directly from ScoutBase (rich text)</option>
                        </select>
                    </label>
                </div>
            )}


            {/* Case when both email options are disabled */}
            {mode === 'none' && (
                <div style={{ color: '#b52d2d', fontSize: '1.1rem' }}>
                    Emailing is disabled for this group. Please contact your group leader for assistance.
                </div>
            )}



            {/* Render the email sending form only if mode is not 'none' */}
            {mode !== 'none' && (
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <input
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
                        />

                        {/* Case when only emailing_direct_enabled is true */}
                        {mode === 'direct' && emailingDirectEnabled && (
                            <>
                                <Suspense fallback={<div>Loading editor…</div>}>
                                    <ReactQuill
                                        value={body}
                                        onChange={setBody}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Write your email here…"
                                        style={{ height: '300px' }}
                                    />
                                </Suspense>
                            </>
                        )}

                        {/* Case when only email_from_client_enabled is true */}
                        {mode === 'client' && emailFromClientEnabled && (
                            <textarea
                                rows={10}
                                placeholder="Write your email here…"
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical', height: '300px' }}
                            />
                        )}


                        {/* Attachments – show only for “direct” e‑mailing */}
                        {mode === 'direct' && (
                            <div style={{ marginTop: '4rem' }}>
                                <label>
                                    Attach files:
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        style={{ display: 'block', marginTop: '0.25rem' }}
                                    />
                                </label>
                            </div>
                        )}

                        <PrimaryButton
                            onClick={handleSend}
                            disabled={sending || !subject || !body || !selectedParents.length}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {sending ? 'Sending…' : `Send to ${selectedParents.length} Parent(s)`}
                        </PrimaryButton>
                    </div>

                    <div style={{ flex: '1 1 60%', maxHeight: 600, overflowY: 'auto' }}>
                        <input
                            type="text"
                            placeholder="Filter by name…"
                            value={emailFilter}
                            onChange={e => setEmailFilter(e.target.value)}
                            style={{ width: '80%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
                        />

                        <PrimaryButton
                            onClick={handleSelectAll}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}
                        >
                            {selectedParents.length === displayedParents.length ? 'Deselect All' : 'Select All'}
                        </PrimaryButton>

                        {loading ? (
                            <p>Loading parents…</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {displayedParents.length ? (
                                    displayedParents.map(p => (
                                        <li key={p.id} style={{ marginBottom: 8 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedParents.includes(p.id)}
                                                    onChange={() => toggleParent(p.id)}
                                                />
                                                <span>{p.name} – {p.email}</span>
                                            </label>
                                        </li>
                                    ))
                                ) : (
                                    <p>No matching parents.</p>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
