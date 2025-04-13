import { Link } from 'react-router-dom';
import {
    Mail,
    FolderKanban,
    Cake,
    Repeat,
    Users,
    Download
} from 'lucide-react';

const reports = [
    {
        path: 'report-parent-emails',
        label: 'Parent Emails',
        icon: <Mail size={18} />,
        description: 'CSV of primary parent email addresses and linked youth'
    },
    {
        path: 'report-youth-by-section',
        label: 'Youth by Section',
        icon: <FolderKanban size={18} />,
        description: 'Summary of youth grouped by section (Cubs, Scouts, etc.)'
    },
    {
        path: 'report-age',
        label: 'Age Report',
        icon: <Cake size={18} />,
        description: 'List of all youth with age calculated from date of birth'
    },
    {
        path: 'report-transitions',
        label: 'Transition History',
        icon: <Repeat size={18} />,
        description: 'Full record of youth section transitions over time'
    },
    {
        path: 'report-parent-engagement',
        label: 'Parent Engagement',
        icon: <Users size={18} />,
        description: 'Number of youth linked to each parent (engagement score)'
    },
    {
        path: 'report-full-export',
        label: 'Full Youth Export',
        icon: <Download size={18} />,
        description: 'Complete youth database including parent and transition info'
    }
];

export default function Reports() {
    return (
        <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Reports</h2>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                💡 <strong>Need a custom report?</strong><br />
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

