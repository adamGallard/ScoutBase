// pages/parent/calendar.jsx
import ParentCalendar from '@/components/ParentCalendar';
import { PageWrapper, PageTitle } from '@/components/common/SharedStyles';

export default function ParentCalendarPage() {
    return (
        <PageWrapper>
            <PageTitle>📅 Event Calendar</PageTitle>
            <ParentCalendar feedUrl={process.env.NEXT_PUBLIC_TERRAIN_CAL_FEED} />
        </PageWrapper>
    );
}