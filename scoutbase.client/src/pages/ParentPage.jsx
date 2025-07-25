import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ParentLayout from '@/components/common/ParentLayout';
import YouthAttendancePage from '@/components/parent/YouthSignin';
import NotificationsPage from '@/components/parent/NotificationsPage';
import CalendarPage from '@/components/parent/CalendarPage';
import LinksPage from '@/components/parent/LinksPage';
import ParentProfilePage from '@/components/parent/ParentProfilePage';
import { getParentSession } from '@/helpers/authHelper';

export default function ParentPage() {
    const { parent, groupId, token } = getParentSession();
    const location = useLocation();

    if (!parent || !groupId || !token) {
        return <Navigate to={`/sign-in${location.search || ''}`} replace />;
    }

    const sharedState = { parent, groupId, token };

    const wrapWithProps = (Component) => <Component parent={parent} groupId={groupId} token={token} />;

    return (
        <ParentLayout>
            <Routes>
                <Route index element={wrapWithProps(YouthAttendancePage)} />
                <Route path="signin" element={wrapWithProps(YouthAttendancePage)} />
                <Route path="notifications" element={wrapWithProps(NotificationsPage)} />
                <Route path="calendar" element={wrapWithProps(CalendarPage)} />
                <Route path="links" element={wrapWithProps(LinksPage)} />
                <Route path="profile" element={wrapWithProps(ParentProfilePage)} />
                <Route path="*" element={<Navigate to="signin" replace />} />
            </Routes>
        </ParentLayout>
    );
}
