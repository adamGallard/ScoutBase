import React, { useState } from 'react';
import {
    PageWrapperParent,
    PageTitle,
    SecondaryButton,
    TabList,
    TabButton,
} from '@/components/common/SharedStyles';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '@/helpers/NotificationContext';

export default function NotificationsPage() {
    const [tab, setTab] = useState('active');
    const { activeNotices, archivedNotices, loading, refreshNotices } = useNotificationContext();

    return (
        <PageWrapperParent style={{ padding: '0rem', paddingBottom: '56px' }}>
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
                        <div key={n.id} style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            padding: '1rem',
                            marginBottom: '1rem',
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {n.title}
                            </div>
                            <div style={{ color: '#555', marginBottom: '0.75rem' }}>
                                {n.message}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <SecondaryButton onClick={() => archivedNotices(n.id)}>
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
                    <div key={n.id} style={{
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: 8,
                        padding: '1rem',
                        marginBottom: '1rem',
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {n.title}
                        </div>
                        <div style={{ color: '#555', marginBottom: '0.75rem' }}>
                            {n.message}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <SecondaryButton onClick={() => activeNotices(n.id)}>
                                Unarchive
                            </SecondaryButton>
                        </div>
                    </div>
                ))
            ) : (
                <p>No archived notices.</p>
            ))}
        </PageWrapperParent>
    );
}
