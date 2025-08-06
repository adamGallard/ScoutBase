import { Link } from 'react-router-dom';
import {
    Info,
    FileText,
    Mail
} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const helpPages = [
    {
        path: 'about',
        label: 'About ScoutBase',
        icon: <Info size={18} />,
        description: 'Learn about the ScoutBase platform — what it does, how it helps, and what powers it. Includes version info and acknowledgments.'
    },
    {
        path: 'changelog',
        label: 'Changelog',
        icon: <FileText size={18} />,
        description: 'Browse all recent updates, improvements, and bug fixes in ScoutBase by version number and release date.'
    },
    {
        path: 'contact',
        label: 'Contact Support',
        icon: <Mail size={18} />,
        description: 'Reach out for help, report an issue, or send feedback directly to the ScoutBase team.'
    }
];

export default function HelpAbout() {
    return (
        <div className="content-box">
            <PageTitle>
                <Info size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                Help & About
            </PageTitle>

            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                💬 <strong>Helpful resources and support.</strong><br />
                Access information about ScoutBase, check what’s changed, or contact the team for assistance.
            </div>

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {helpPages.map((p) => (
                    <li key={p.path} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        background: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginTop: '2px', color: '#0F5BA4' }}>{p.icon}</div>
                        <div>
                            <Link
                                to={`/admin/${p.path}`}
                                style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0F5BA4', textDecoration: 'none' }}
                            >
                                {p.label}
                            </Link>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>{p.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
