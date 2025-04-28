// src/pages/parent/NotificationsPage.jsx

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    PageWrapper,
    PageTitle,
    SecondaryButton,
    TabList,
    TabButton,
} from '@/components/common/SharedStyles';
import { Bell } from 'lucide-react'; 
export default function NotificationsPage() {
    const { state } = useLocation();
    const groupId = state?.groupId;
    const parentId = state?.parent?.id;

    const [tab, setTab] = useState('active'); // 'active' | 'archived'
    const [activeNotices, setActiveNotices] = useState([]);
    const [archivedNotices, setArchivedNotices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch notices + ack records and split into two lists
    const fetchNotices = async () => {
        if (!groupId || !parentId) return;
        setLoading(true);

        // 1) get all notifications for this group
        const { data: notifs, error: notifErr } = await supabase
            .from('notifications')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });
        if (notifErr) {
            console.error('Error loading notifications:', notifErr);
            setLoading(false);
            return;
        }

        // 2) get all ack records for this parent
        const { data: acks, error: ackErr } = await supabase
            .from('notification_acknowledgements')
            .select('notification_id')
            .eq('parent_id', parentId);
        if (ackErr) {
            console.error('Error loading acknowledgements:', ackErr);
            setLoading(false);
            return;
        }

        const ackedIds = new Set(acks.map(a => a.notification_id));
        setActiveNotices(notifs.filter(n => !ackedIds.has(n.id)));
        setArchivedNotices(notifs.filter(n => ackedIds.has(n.id)));
        setLoading(false);
    };

    useEffect(() => {
        fetchNotices();
    }, [groupId, parentId]);

    // Archive (insert ack) or Unarchive (delete ack)
    const toggleArchive = async (notificationId, archive) => {
        if (archive) {
            await supabase
                .from('notification_acknowledgements')
                .insert({ notification_id: notificationId, parent_id: parentId });
        } else {
            await supabase
                .from('notification_acknowledgements')
                .delete()
                .match({ notification_id: notificationId, parent_id: parentId });
        }
        fetchNotices();
    };

    return (
        <PageWrapper style={{ padding: '1rem', paddingBottom: '56px' }}>
            <PageTitle><Bell /> Notices</PageTitle>

            <TabList style={{ marginBottom: '1rem' }}>
                <TabButton onClick={() => setTab('active')} isActive={tab === 'active'}>Active</TabButton>
                <TabButton onClick={() => setTab('archived')} isActive={tab === 'archived'}>Archived</TabButton>
            </TabList>

            {loading ? (
                <p>Loading notices…</p>
            ) : (tab === 'active' ? (
                activeNotices.length > 0 ? (
                    activeNotices.map(n => (
                        <div
                            key={n.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                padding: '1rem',
                                marginBottom: '1rem',
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {n.title}
                            </div>
                            <div style={{ color: '#555', marginBottom: '0.75rem' }}>
                                {n.message}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <SecondaryButton onClick={() => toggleArchive(n.id, true)}>
                                    Archive
                                </SecondaryButton>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No new notices.</p>
                )
            ) : archivedNotices.length > 0 ? (
                archivedNotices.map(n => (
                    <div
                        key={n.id}
                        style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            padding: '1rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {n.title}
                        </div>
                        <div style={{ color: '#555', marginBottom: '0.75rem' }}>
                            {n.message}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <SecondaryButton onClick={() => toggleArchive(n.id, false)}>
                                Unarchive
                            </SecondaryButton>
                        </div>
                    </div>
                ))
            ) : (
                <p>No archived notices.</p>
            ))}
        </PageWrapper>
    );
}
