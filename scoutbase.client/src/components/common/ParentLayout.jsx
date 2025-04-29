// src/components/common/ParentLayout.jsx

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import LoggedInHeader from './LoggedInHeader';
import FooterNav from './FooterNav';
import { PageWrapper } from './SharedStyles';
import UpdatePinModal from '@/components/UpdatePinModal';

export default function ParentLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;
    const parent = state?.parent;
    const groupId = state?.groupId;

    // preserve the original group slug for logout/login redirects
    const query = new URLSearchParams(location.search);
    const groupSlug = query.get('group');

    const [showUpdatePinModal, setShowUpdatePinModal] = useState(false);
    const [noticeCount, setNoticeCount] = useState(0);
    const [matchingParent, setMatchingParent] = useState(null);


    useEffect(() => {
        if (!parent?.id || !groupId) { return <Navigate to={`/sign-in?group=${groupSlug}`} replace />;
    }

        (async () => {
            // fetch all notifications for this group
            const { data: notifs, error: notifErr } = await supabase
                .from('notifications')
                .select('id')
                .eq('group_id', groupId);
            if (notifErr) {
                console.error('Error fetching notifications:', notifErr);
                return;
            }

            // fetch all acknowledgements for this parent
            const { data: acks, error: ackErr } = await supabase
                .from('notification_acknowledgements')
                .select('notification_id')
                .eq('parent_id', parent.id);
            if (ackErr) {
                console.error('Error fetching acknowledgements:', ackErr);
                return;
            }

            const ackSet = new Set(acks.map(a => a.notification_id));
            const unread = notifs.filter(n => !ackSet.has(n.id)).length;
            setNoticeCount(unread);

            setMatchingParent(parent);
        })();
    }, [parent, groupId]);

    return (
        <PageWrapper style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <LoggedInHeader
                parentName={parent?.name}
                onUpdatePin={() => setShowUpdatePinModal(true)}
                onLogout={() => {
                    // clear any in-memory parent state
                    setMatchingParent(null);
                    // redirect back to the group-specific login
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
        </PageWrapper>
    );
}
