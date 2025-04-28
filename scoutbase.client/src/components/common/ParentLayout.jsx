// src/components/common/ParentLayout.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import LoggedInHeader from './LoggedInHeader';
import FooterNav from './FooterNav';
import { PageWrapper } from './SharedStyles';

export default function ParentLayout({ children }) {
    const { state } = useLocation();
    const parent = state?.parent;
    const groupId = state?.groupId;

    const [noticeCount, setNoticeCount] = useState(0);

    useEffect(() => {
        if (!parent?.id || !groupId) return;

        (async () => {
            // 1) fetch all notifs for this group
            const { data: notifs, error: notifErr } = await supabase
                .from('notifications')
                .select('id')
                .eq('group_id', groupId);
            if (notifErr) {
                console.error('Error fetching notifications:', notifErr);
                return;
            }

            // 2) fetch all acknowledgements for this parent
            const { data: acks, error: ackErr } = await supabase
                .from('notification_acknowledgements')
                .select('notification_id')
                .eq('parent_id', parent.id);
            if (ackErr) {
                console.error('Error fetching acknowledgements:', ackErr);
                return;
            }
            const ackSet = new Set(acks.map(a => a.notification_id));

            // 3) count how many notif IDs are *not* in ackSet
            const unread = notifs.filter(n => !ackSet.has(n.id)).length;
            setNoticeCount(unread);
        })();
    }, [parent, groupId]);

    return (
        <PageWrapper style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <LoggedInHeader
                parentName={parent?.name}
            /* …other props… */
            />
            <main style={{ flex: 1, padding: '1rem', paddingBottom: '56px' }}>
                {children}
            </main>
            <FooterNav noticeCount={noticeCount} />
        </PageWrapper>
    );
}
