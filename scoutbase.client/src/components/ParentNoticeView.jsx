import { useEffect, useState } from 'react';
import { getParentSupabaseClient } from '@/lib/parentSupabaseClient';

const supabase = getParentSupabaseClient();

export default function ParentNoticeView({ groupId, parentId }) {
    const [notices, setNotices] = useState([]);
    const [acknowledgements, setAcknowledgements] = useState([]);
    const [linkedSections, setLinkedSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId || !parentId) return;

        const fetchAll = async () => {

            try {
                // 1. Fetch linked sections
                const { data: sectionData, error: sectionErr } = await supabase
                    .from('parent_youth')
                    .select('youth(section)')
                    .eq('parent_id', parentId);

                if (sectionErr) throw sectionErr;

                const sections = sectionData.map(s => s.youth?.section).filter(Boolean);
                setLinkedSections(sections);

                // 2. Fetch notices
                const { data: noticesData, error: noticeErr } = await supabase
                    .from('notifications')
                    .select('*, notification_acknowledgements!left(*)')
                    .eq('group_id', groupId)
                    .order('created_at', { ascending: false });

                if (noticeErr) throw noticeErr;

                // 3. Fetch acknowledgements
                const { data: ackData, error: ackErr } = await supabase
                    .from('notification_acknowledgements')
                    .select('notification_id')
                    .eq('parent_id', parentId);

                if (ackErr) throw ackErr;

                const readIds = new Set(ackData.map(a => a.notification_id));

                // 4. Filter unread notices relevant to parent
                const filtered = noticesData.filter(n => {
                    const isUnread = !readIds.has(n.id);
                    const isForAll = n.target_section === 'All';
                    const isLinked = sections.includes(n.target_section);
                    return isUnread && (isForAll || isLinked);
                });

                setNotices(filtered);
            } catch (err) {
                console.error('❌ Error loading notices or acknowledgements:', err);
            }

            setLoading(false);
        };

        fetchAll();
    }, [groupId, parentId]);

    const acknowledgeNotice = async (noticeId) => {
        const { error } = await supabase
            .from('notification_acknowledgements')
            .insert([{ parent_id: parentId, notification_id: noticeId }]);

        if (!error) {
            setAcknowledgements(prev => [...prev, noticeId]);
            setNotices(prev => prev.filter(n => n.id !== noticeId));
        }
    };

    if (loading) return <p>Loading notices...</p>;
    if (notices.length === 0) return <p>No notices found.</p>;

    return (
        <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
        }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#0F5BA4' }}>Notices</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {notices.slice(0, 5).map((notice) => (
                    <li key={notice.id} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong>{notice.title}</strong>
                            <button
                                onClick={() => acknowledgeNotice(notice.id)}
                                style={{
                                    fontSize: '0.75rem',
                                    backgroundColor: '#0F5BA4',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.5rem',
                                    cursor: 'pointer',
                                    marginLeft: 'auto'
                                }}
                            >
                                Mark as Read
                            </button>
                        </div>

                        <p style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>{notice.message}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {notice.target_section && (
                                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    {notice.target_section}
                                </small>
                            )}

                            <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                {new Date(notice.created_at).toLocaleDateString()}
                            </small>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
