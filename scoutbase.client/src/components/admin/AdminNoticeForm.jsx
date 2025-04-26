import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    PageWrapper,
    PrimaryButton,
    AdminInput,
    AdminTextArea,
    PageTitle,
    StyledSelect,
    AdminTable
} from '@/components/common/SharedStyles';
import { Pencil, Trash } from 'lucide-react';

import { sections } from '@/components/common/Lookups';

export default function AdminNoticeForm({ groupId, userInfo }) {
    const [form, setForm] = useState({
        title: '',
        message: '',
        section: 'all'
    });
    const [status, setStatus] = useState(null);
    const [notices, setNotices] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Build the section‐select options from our static lookup
    const options = [
        { value: 'all', label: 'All Parents' },
        ...sections.map(s => ({ value: s.code, label: s.label }))
    ];

    useEffect(() => {
        if (groupId) fetchNotices();
    }, [groupId]);

    const fetchNotices = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (!error) setNotices(data);
    };

    const submit = async () => {
        if (!form.title || !form.message) return;
        setStatus('sending');

        const payload = {
            group_id: groupId,
            title: form.title,
            message: form.message,
            target_section: form.section === 'all' ? 'All' : form.section
        };

        let error;
        if (editingId) {
            ({ error } = await supabase
                .from('notifications')
                .update(payload)
                .eq('id', editingId));
        } else {
            ({ error } = await supabase
                .from('notifications')
                .insert([payload]));
        }

        setStatus(error ? 'error' : 'success');

        if (!error) {
            setForm({ title: '', message: '', section: 'all' });
            setEditingId(null);
            fetchNotices();
        }
    };

    const handleEdit = msg => {
        setForm({
            title: msg.title,
            message: msg.message,
            section: msg.target_section?.toLowerCase() === 'all' ? 'all' : msg.target_section
        });
        setEditingId(msg.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async id => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
        if (!error) fetchNotices();
    };

    const formatDate = dt =>
        new Date(dt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

    return (
        <PageWrapper>
            <PageTitle>Send a Parent Notice</PageTitle>

            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <StyledSelect
                    value={form.section}
                    onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </StyledSelect>

                <AdminInput
                    placeholder="Notice title"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />

                <AdminTextArea
                    placeholder="Message to parents..."
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />

                <PrimaryButton onClick={submit} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending...' : 'Send Notice'}
                </PrimaryButton>

                {status === 'success' && <p style={{ color: 'green' }}>✅ Message sent!</p>}
                {status === 'error' && <p style={{ color: 'red' }}>❌ Error sending message.</p>}
            </div>

            {notices.length > 0 && (
                <div style={{ marginTop: '3rem' }}>
                    <h3>Sent Notices</h3>
                    <AdminTable>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Section</th>
                                <th>Message</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object
                                .values(
                                    notices.reduce((acc, notice) => {
                                        const key = [
                                            notice.title,
                                            notice.message,
                                            notice.group_id,
                                            notice.target_section || 'All'
                                        ].join('|');

                                        if (!acc[key]) {
                                            acc[key] = {
                                                ...notice,
                                                recipients: notice.parent_id ? 1 : 'All',
                                                firstSent: notice.created_at,
                                                groupLabel: notice.target_section || 'All'
                                            };
                                        } else {
                                            acc[key].recipients =
                                                acc[key].recipients === 'All'
                                                    ? 'All'
                                                    : acc[key].recipients + 1;
                                            acc[key].firstSent =
                                                new Date(acc[key].firstSent) < new Date(notice.created_at)
                                                    ? acc[key].firstSent
                                                    : notice.created_at;
                                        }
                                        return acc;
                                    }, {})
                                )
                                .map(msg => (
                                    <tr key={msg.id}>
                                        <td>{formatDate(msg.firstSent)}</td>
                                        <td>{msg.title}</td>
                                        <td>{msg.groupLabel}</td>
                                        <td>{msg.message}</td>
                                        <td>
                                            <button onClick={() => handleEdit(msg)} title="Edit">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(msg.id)} title="Delete">
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </AdminTable>
                </div>
            )}
        </PageWrapper>
    );
}
