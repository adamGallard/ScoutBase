import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sections } from '@/components/common/Lookups.js';
import {
    PageWrapper,
    PageTitle,
    PrimaryButton,
    CompactSelect,
} from '@/components/common/SharedStyles';
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
    const [mode, setMode] = useState('direct');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [emailFilter, setEmailFilter] = useState(''); 

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

            if (sectionFilter) query = query.eq('youth.section', sectionFilter);

            const { data, error } = await query.order('name', { foreignTable: 'parent', ascending: true });
            setLoading(false);
            if (error) {
                console.error('Error fetching parents:', error);
                return;
            }

            const dedup = {};
            data.forEach(r => {
                const p = r.parent;
                const sec = r.youth?.section ?? '';
                dedup[p.id] = { ...p, section: sec };
            });
            setParentsList(Object.values(dedup).sort((a, b) => a.name.localeCompare(b.name)));
        })();
    }, [groupId, sectionFilter]);

    const displayedParents = parentsList.filter(p => p.name.toLowerCase().includes(emailFilter.toLowerCase()));

    const toggleParent = id =>
        setSelectedParents(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    const handleSelectAll = () =>
        setSelectedParents(prev =>
            prev.length === displayedParents.length ? [] : displayedParents.map(p => p.id)
        );

    const handleFileChange = e => {
        setAttachments(Array.from(e.target.files));
    };

    const handleSend = async () => {
        if (!subject || !body || !selectedParents.length) return;
        const toList = parentsList
            .filter(p => selectedParents.includes(p.id))
            .map(p => p.email)
            .filter(e => !!e);

        if (!toList.length) return alert('No valid email addresses selected.');

        if (mode === 'direct') {
            setSending(true);
            try {
                // convert files to base64 attachments
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
        } else {
            const mailto = [
                `mailto:?bcc=${encodeURIComponent(toList.join(','))}`,
                `subject=${encodeURIComponent(subject)}`,
                `body=${encodeURIComponent(body)}`,
            ].join('?');
            window.location.href = mailto;
        }
    };

    const codeToSectionLabel = code => sections.find(s => s.code === code)?.label ?? code;

    return (
        <div className="content-box">
            <PageTitle><Mail size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} /> Email Parents</PageTitle>
            <section id="email-page-instructions">
                <p><strong>Email parents directly or via their own mail app.</strong></p>
                <ol>
                    <li>Choose “Send direct” to send from <code>no-reply@scoutbase.app</code> (all addresses go in BCC), or “Open Mail” to launch your local email client.</li>
                    <li>Filter by section or by email address, select recipients, add a subject and rich-text body (and attachments if needed), then click <code>Send</code>.</li>
                </ol>
            </section>
            <br />
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
                        Open Mail Client
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

                    <div style={{ margin: '3rem 0' }}>
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
                                      {/* Email filter input */}
                                       <input
                     type="text"
                                         placeholder="Filter by name…"
                                         value={emailFilter}
                                         onChange={e => setEmailFilter(e.target.value)}
                                         style={{
 width: '80%',
                                           padding: '0.5rem',
                                           marginBottom: '0.5rem',
                                           borderRadius: 4,
                                           border: '1px solid #ccc'
                     }}
                   />
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
                                {displayedParents.length ? (
                                    displayedParents.map(p => (
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
        </div>
    );
}
