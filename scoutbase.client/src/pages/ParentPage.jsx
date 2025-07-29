import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ParentLayout from '@/components/common/ParentLayout';
import YouthAttendancePage from '@/components/parent/YouthSignin';
import NotificationsPage from '@/components/parent/NotificationsPage';
import CalendarPage from '@/components/parent/CalendarPage';
import LinksPage from '@/components/parent/LinksPage';
import ParentProfilePage from '@/components/parent/ParentProfilePage';
import { useParentSession } from '@/helpers/SessionContext';
import { NotificationProvider } from '@/helpers/NotificationContext';

export default function ParentPage() {
    const { session, loading } = useParentSession();
    const location = useLocation();

    if (loading) {
        return <div>Loading session...</div>;
    }

    if (!session?.parent || !session?.groupId || !session?.token) {
        return <Navigate to={`/sign-in${location.search || ''}`} replace />;
    }

    return (
        <NotificationProvider>
            <ParentLayout>
                <Routes>
                    <Route index element={<YouthAttendancePage />} />
                    <Route path="signin" element={<YouthAttendancePage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="links" element={<LinksPage />} />
                    <Route path="profile" element={<ParentProfilePage />} />
                    <Route path="*" element={<Navigate to="signin" replace />} />
                </Routes>
            </ParentLayout>
         </NotificationProvider>
    );
}
