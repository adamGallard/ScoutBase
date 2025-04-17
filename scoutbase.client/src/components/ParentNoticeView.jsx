import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PageTitle, HighlightNote } from '@/components/SharedStyles';

export default function ParentNoticeView({ groupId, parentId }) {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) return;

        const fetchNotices = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('group_id', groupId)
                .or(`parent_id.is.null,parent_id.eq.${parentId}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to load notices:', error);
            } else {
                setNotices(data);
            }

            setLoading(false);
        };

        fetchNotices();
    }, [groupId, parentId]);

    return (
        <div className="content-box">
            <PageTitle>Notices</PageTitle>

            {loading && <p>Loading notices...</p>}
            {!loading && notices.length === 0 && <p>No notices found.</p>}

            <ul style={{ padding: 0, listStyle: 'none' }}>
                {notices.map((notice) => (
                    <li
                        key={notice.id}
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            padding: '1rem',
                            backgroundColor: notice.parent_id ? '#fffbe6' : '#f0f9ff'
                        }}
                    >
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0F5BA4' }}>
                            {notice.title}
                        </strong>
                        <p style={{ margin: '0.5rem 0' }}>{notice.message}</p>
                        <small style={{ color: '#6b7280' }}>
                            {new Date(notice.created_at).toLocaleString()} {notice.parent_id && '(Private)'}
                        </small>
                    </li>
                ))}
            </ul>
        </div>
    );
}