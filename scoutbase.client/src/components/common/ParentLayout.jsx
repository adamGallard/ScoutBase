// src/components/common/ParentLayout.jsx

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoggedInHeader from './LoggedInHeader';
import FooterNav from './FooterNav';
import { PageWrapperParent } from './SharedStyles';
import UpdatePinModal from '@/components/UpdatePinModal';
import { getParentSession } from '@/helpers/authHelper';
import { useNotificationContext } from '@/helpers/NotificationContext';

export default function ParentLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Use session for parent and groupId
    const { parent, groupId } = getParentSession();

    // preserve group slug from query string
    const query = new URLSearchParams(location.search);
    const groupSlug = query.get('group');

    const [showUpdatePinModal, setShowUpdatePinModal] = useState(false);
    const [matchingParent, setMatchingParent] = useState(null);

    // Get noticeCount directly from NotificationContext!
    const { noticeCount } = useNotificationContext();

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

            {showUpdatePinModal && parent && (
                <UpdatePinModal
                    isOpen={true}
                    onClose={() => setShowUpdatePinModal(false)}
                    parentId={parent.id}
                    groupId={groupId}
                />
            )}

            <FooterNav noticeCount={noticeCount} />
        </PageWrapperParent>
    );
}
