// src/components/common/ParentLayout.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getParentSupabaseClient } from '@/lib/parentSupabaseClient';
import LoggedInHeader from './LoggedInHeader';
import FooterNav from './FooterNav';
import { PageWrapperParent } from './SharedStyles';
import UpdatePinModal from '@/components/UpdatePinModal';
import { getParentSession } from '@/helpers/authHelper';

export default function ParentLayout({ children }) {
    const supabase = getParentSupabaseClient();
    const location = useLocation();
    const navigate = useNavigate();

    // Use session for parent and groupId
    const { parent, groupId } = getParentSession();

    // preserve group slug from query string
    const query = new URLSearchParams(location.search);
    const groupSlug = query.get('group');

    const [showUpdatePinModal, setShowUpdatePinModal] = useState(false);
    const [noticeCount, setNoticeCount] = useState(0);
    const [matchingParent, setMatchingParent] = useState(null);

    useEffect(() => {
        // This hook runs for notice badge, NOT auth. No redirects!
        if (!parent?.id || !groupId) {
            setNoticeCount(0);
            return;
        }
        (async () => {
            // fetch all notifications for this group
            const { data: notifs, error: notifErr } = await supabase
                .from('notifications')
                .select('id')
                .eq('group_id', groupId);
            if (notifErr) {
                setNoticeCount(0);
                return;
            }

            // fetch all acknowledgements for this parent
            const { data: acks, error: ackErr } = await supabase
                .from('notification_acknowledgements')
                .select('notification_id')
                .eq('parent_id', parent.id);
            if (ackErr) {
                setNoticeCount(0);
                return;
            }

            const ackSet = new Set(acks.map(a => a.notification_id));
            const unread = notifs.filter(n => !ackSet.has(n.id)).length;
            setNoticeCount(unread);

            setMatchingParent(parent);
        })();
    }, [parent, groupId, supabase]);

    return (
        <PageWrapperParent style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <LoggedInHeader
                parentName={parent?.name}
                onUpdatePin={() => setShowUpdatePinModal(true)}
                onLogout={() => {
                    setMatchingParent(null);
                    navigate(`/sign-in?group=${groupSlug}`, { replace: true });
                }}
            />

            <main style={{ flex: 1, padding: '1rem', paddingBottom: '56px' }}>
                {children}
            </main>

            {showUpdatePinModal && matchingParent && (
                <UpdatePinModal
                    isOpen={true}
                    onClose={() => setShowUpdatePinModal(false)}
                    parentId={matchingParent.id}
                    groupId={groupId}
                />
            )}

            <FooterNav noticeCount={noticeCount} />
        </PageWrapperParent>
    );
}
