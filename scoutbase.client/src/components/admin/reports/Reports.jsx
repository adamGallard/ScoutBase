import { Link } from 'react-router-dom';
import {
    Mail,
    FolderKanban,
    Cake,
    Repeat,
    Users,
    Download,
    BarChart2,
    CalendarCheck,
    CalendarClock,
    Calendar,
    BookOpenCheck,
    Award,
    TrendingUpDown,
    FileCheck2
} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const reports = [
    {
        path: 'report-attendance',
        label: 'Attendance',
        icon: <CalendarCheck size={18} />,
        description: 'View daily attendance for all youth and leaders. This report helps leaders track participation, identify trends, and maintain accurate attendance records for each meeting.'
    },
    {
        path: 'report-attendance-period',
        label: 'Attendance Period',
        icon: <CalendarClock size={18} />,
        description: 'Summarizes attendance across a selected date range or term, allowing analysis of attendance trends, participation rates, and absences for both youth and adult volunteers.'
    },
    {
        path: 'report-attendance-adult',
        label: 'Adult Attendance',
        icon: <Calendar size={18} />,
        description: 'Tracks attendance records specifically for all adult volunteers and leaders, supporting compliance, safety requirements, and engagement analysis.'
    },
    {
        path: 'inspection',
        label: 'Inspections',
        icon: <BookOpenCheck size={18} />,
        description: 'Displays patrol and personal inspection scores, including breakdowns by patrol, date, and ranking. Helps motivate youth and track readiness for activities and camps.'
    },
    {
        path: 'badge-order',
        label: 'Badge Order',
        icon: <Award size={18} />,
        description: 'Manages the end-to-end badge ordering process, including pending approvals from Terrain, manual badge entry, orders ready for submission, and awarded badges. Provides CSV export for records and easy communication with badge suppliers.'
    },
    {
        path: 'report-parent-emails',
        label: 'Adult Emails',
        icon: <Mail size={18} />,
        description: 'Exports a CSV of primary adult email addresses and the youth linked to each contact, making it simple to create mailing lists for group communication and updates.'
    },
    {
        path: 'report-youth-by-section',
        label: 'Youth by Section',
        icon: <FolderKanban size={18} />,
        description: 'Summarizes youth membership grouped by section (Joeys, Cubs, Scouts, Venturers), giving an overview of section sizes and demographics at a glance.'
    },
    {
        path: 'report-age',
        label: 'Age Report',
        icon: <Cake size={18} />,
        description: 'Lists all youth with their age calculated from their date of birth, supporting eligibility checks for transitions, activities, or section assignments.'
    },
    {
        path: 'report-transitions',
        label: 'Linking History',
        icon: <Repeat size={18} />,
        description: 'Provides a full record of youth section transitions, including linking, invested, and retired stages, to track movement and engagement over time'
    },
    {
        path: 'report-projections',
        label: 'Youth Projections',
        icon: <TrendingUpDown size={18} />,
        description: 'Projects expected youth numbers in each section for upcoming terms and years, using historical data and transition patterns. Helps leaders plan for recruitment, linking, and resourcing.'
    },
    {
        path: 'report-full-export',
        label: 'Full Export',
        icon: <Download size={18} />,
        description: 'Exports the complete youth database, including parent details and transition information, as a CSV for backup, audit, or advanced analysis.'
    },
    {
        path: 'report-data-quality',
        label: 'Data Quality',
        icon: <FileCheck2 size={18} />,
        description: 'Highlights data issues or missing information in group records, such as unlinked parents, missing primary contacts, or incomplete transition history, ensuring data is reliable and actionable.'
    }
];

export default function Reports() {
    return (
        <div className="content-box">
            <PageTitle>
                <BarChart2 size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Reports
            </PageTitle>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                📊 <strong>Explore reports and analytics for your group.</strong><br />
                Reports provide a range of summaries and detailed CSV exports to help you track attendance, youth demographics, transitions, data quality, badge orders, and more. Each report is designed for group leaders and section leaders to make informed decisions and maintain accurate records.
                <br /><br /> 💡 <strong>Need a custom report?</strong><br />
                If there’s a specific report you’d find helpful but don’t see listed here, feel free to get in touch — we're always happy to add new reports that make your life easier!
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {reports.map((r) => (
                    <li key={r.path} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        background: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginTop: '2px', color: '#0F5BA4' }}>{r.icon}</div>
                        <div>
                            <Link
                                to={`/admin/${r.path}`}
                                style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0F5BA4', textDecoration: 'none' }}
                            >
                                {r.label}
                            </Link>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>{r.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
