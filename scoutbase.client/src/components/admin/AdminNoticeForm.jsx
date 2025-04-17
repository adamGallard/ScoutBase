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

const sections = ['All', 'Joeys', 'Cubs', 'Scouts', 'Venturers'];

export default function AdminNoticeForm({ groupId, userInfo }) {
    const [form, setForm] = useState({ title: '', message: '', section: 'All' });
    const [status, setStatus] = useState(null);
    const [notices, setNotices] = useState([]);

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

        let parentIds = null;

        if (form.section !== 'All') {
            const { data: links } = await supabase
                .from('parent_youth')
                .select('parent_id, youth (section)')
                .eq('group_id', groupId);

            const matching = links
                .filter(link => link.youth?.section === form.section)
                .map(link => link.parent_id);

            parentIds = [...new Set(matching)];
        }

        const insertData = parentIds && parentIds.length > 0
            ? parentIds.map(pid => ({
                group_id: groupId,
                title: form.title,
                message: form.message,
                parent_id: pid
            }))
            : [{
                group_id: groupId,
                title: form.title,
                message: form.message,
                parent_id: null
            }];

        const { error } = await supabase.from('notifications').insert(insertData);
        setStatus(error ? 'error' : 'success');

        if (!error) {
            setForm({ title: '', message: '', section: 'All' });
            fetchNotices();
        }
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
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(
                                notices.reduce((acc, notice) => {
                                    const key = `${notice.title}|${notice.message}|${notice.group_id}`;
                                    if (!acc[key]) {
                                        acc[key] = {
                                            ...notice,
                                            recipients: notice.parent_id ? 1 : 'All',
                                            firstSent: notice.created_at,
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
                            ).map((msg) => (
                                <tr key={msg.id}>
                                    <td>{formatDate(msg.firstSent)}</td>
                                    <td>{msg.title}</td>
                                    <td>{msg.recipients === 'All' ? 'All Parents' : `${msg.recipients} targeted`}</td>
                                    <td>{msg.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </AdminTable>
                </div>
            )}
        </PageWrapper>
    );
}
