import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getParentSupabaseClient } from '@/lib/parentSupabaseClient';
import { useParentSession } from '@/helpers/SessionContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { session } = useParentSession();
    const parent = session?.parent;
    const groupId = session?.groupId;

    const [noticeCount, setNoticeCount] = useState(0);
    const [activeNotices, setActiveNotices] = useState([]);
    const [archivedNotices, setArchivedNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Main fetch logic for all notices + acks
    const fetchNotices = useCallback(async () => {
        if (!parent?.id || !groupId) {
            setNoticeCount(0);
            setActiveNotices([]);
            setArchivedNotices([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const supabase = getParentSupabaseClient();

        const { data: notifs = [], error: notifErr } = await supabase
            .from('notifications')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (notifErr) {
            setLoading(false);
            setNoticeCount(0);
            return;
        }

        const { data: acks = [], error: ackErr } = await supabase
            .from('notification_acknowledgements')
            .select('notification_id')
            .eq('parent_id', parent.id);

        if (ackErr) {
            setLoading(false);
            setNoticeCount(0);
            return;
        }

        const ackedIds = new Set(acks.map(a => a.notification_id));
        setActiveNotices(notifs.filter(n => !ackedIds.has(n.id)));
        setArchivedNotices(notifs.filter(n => ackedIds.has(n.id)));
        setNoticeCount(notifs.filter(n => !ackedIds.has(n.id)).length);
        setLoading(false);
    }, [parent?.id, groupId]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    return (
        <NotificationContext.Provider value={{
            noticeCount,
            activeNotices,
            archivedNotices,
            loading,
            refreshNotices: fetchNotices,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    return useContext(NotificationContext);
}
