import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ParentLayout from '@/components/common/ParentLayout';
import YouthAttendancePage from '@/components/parent/YouthAttendancePage';
import NotificationsPage from '@/components/parent/NotificationsPage';
import CalendarPage from '@/components/parent/CalendarPage';
import LinksPage from '@/components/parent/LinksPage';

export default function ParentPage() {
    return (
        <ParentLayout>
            <Routes>
                {/* default to the sign-in/out view */}
                <Route index element={<YouthAttendancePage />} />

                <Route path="signin" element={<YouthAttendancePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="links" element={<LinksPage />} />

                {/* catch-all back to signin */}
                <Route path="*" element={<Navigate to="signin" replace />} />
                <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
        </ParentLayout>
    );
}