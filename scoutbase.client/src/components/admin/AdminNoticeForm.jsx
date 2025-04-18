﻿import { useEffect, useState } from 'react';
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

const sections = ['All Parents', 'Joeys', 'Cubs', 'Scouts', 'Venturers'];

export default function AdminNoticeForm({ groupId, userInfo }) {
    const [form, setForm] = useState({ title: '', message: '', section: 'All' });
    const [status, setStatus] = useState(null);
    const [notices, setNotices] = useState([]);
    const [editingId, setEditingId] = useState(null);

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
        const data = {
            group_id: groupId,
            title: form.title,
            message: form.message,
            target_section: form.section === 'All Parents' ? 'All' : form.section,
        };

        let error;

        if (editingId) {
            const result = await supabase.from('notifications').update(data).eq('id', editingId);
            error = result.error;
        } else {
            const result = await supabase.from('notifications').insert([data]);
            error = result.error;
        }

        setStatus(error ? 'error' : 'success');

        if (!error) {
            setForm({ title: '', message: '', section: 'All Parents' });
            setEditingId(null);
            fetchNotices();
        }
    };

    const handleEdit = (msg) => {
        setForm({
            title: msg.title,
            message: msg.message,
            section: msg.target_section || 'All Parents'
        });
        setEditingId(msg.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (!error) fetchNotices();
    };

    const formatDate = (dt) => new Date(dt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    return (
        <PageWrapper>
            <PageTitle>Send a Parent Notice</PageTitle>

            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <StyledSelect
                    value={form.section}
                    onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                >
                    {sections.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </StyledSelect>

                <AdminInput
                    placeholder="Notice title"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                />

                <AdminTextArea
                    placeholder="Message to parents..."
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
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
                            {Object.values(
                                Object.values(
                                    notices.reduce((acc, notice) => {
                                        const key = `${notice.title}|${notice.message}|${notice.group_id}|${notice.target_section || 'All Parents'}`;
                                        if (!acc[key]) {
                                            acc[key] = {
                                                ...notice,
                                                recipients: notice.parent_id ? 1 : 'All',
                                                firstSent: notice.created_at,
                                                groupLabel: notice.target_section || 'All Parents'
                                            };
                                        } else {
                                            acc[key].recipients =
                                                acc[key].recipients === 'All' ? 'All' : acc[key].recipients + 1;
                                            acc[key].firstSent = new Date(acc[key].firstSent) < new Date(notice.created_at)
                                                ? acc[key].firstSent
                                                : notice.created_at;
                                        }
                                        return acc;
                                    }, {})
                                )
                            ).map((msg) => (
                                <tr key={msg.id}>
                                    <td>{formatDate(msg.firstSent)}</td>
                                    <td>{msg.title}</td>
                                    <td>{msg.groupLabel}</td>
                                    <td>{msg.message}</td>
                                    <td>
                                        <button onClick={() => handleEdit(msg)} title="Edit"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(msg.id)} title="Delete"><Trash size={16} /></button>
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
