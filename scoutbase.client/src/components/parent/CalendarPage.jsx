// pages/parent/calendarpage.jsx

import React from 'react';
import ParentCalendar from '@/components/parent/ParentCalendar';
import { PageWrapper, PageTitle } from '@/components/common/SharedStyles';
import { Calendar } from 'lucide-react';
export default function ParentCalendarPage() {
    // Vite injects env vars prefixed with VITE_ into import.meta.env
    const feedUrl = import.meta.env.VITE_TERRAIN_CAL_FEED;

    return (
        <PageWrapper style={{ padding: '1rem', paddingBottom: '56px' }}>
            <PageTitle><Calendar /> Event Calendar</PageTitle>
            <ParentCalendar feedUrl={feedUrl} />
        </PageWrapper>
    );
}