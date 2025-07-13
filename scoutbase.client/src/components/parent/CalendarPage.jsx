// pages/parent/calendarpage.jsx

import React, { useState, useEffect } from 'react';
import ParentCalendar from '@/components/parent/ParentCalendar';
import { PageWrapperParent, PageTitle } from '@/components/common/SharedStyles';
import { Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient'
import { useLocation } from 'react-router-dom';


export default function ParentCalendarPage() {
    // Vite injects env vars prefixed with VITE_ into import.meta.env
    const [feedUrl, setFeedUrl] = useState('');
    const [error, setError] = useState(null);
    const { state } = useLocation();
    const groupId = state?.groupId;

    useEffect(() => {
        async function fetchCalendarUrl() {
            const { data, error } = await supabase
                .from('groups')
                .select('calendar_url')
                .eq('id', groupId)
                .single();

            if (error) {
                console.error('Error fetching calendar URL:', error);
                setError(error);
            } else {
                const url = data.calendar_url;
                setFeedUrl(url);
                console.log('Calendar URL for the group:', url);
            }
        }

        fetchCalendarUrl();
    }, [groupId]); // Re-fetch when the groupId changes

    if (error) {
        return <div>Error fetching calendar URL.</div>;
    }

    return (
        <PageWrapperParent style={{ padding: '0rem', paddingBottom: '56px' }}>
            <PageTitle><Calendar /> Event Calendar</PageTitle>
            <ParentCalendar feedUrl={feedUrl} />
        </PageWrapperParent>
    );
}