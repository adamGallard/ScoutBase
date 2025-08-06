import { Link } from 'react-router-dom';
import {
    Users,
    ClipboardCheck,
    UserPlus,
    Flag
} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const members = [
    {
        path: 'registrations',
        label: 'Registrations',
        icon: <ClipboardCheck size={18} />,
        description: 'View and manage new member registrations, approve or edit details, and assign them to the appropriate section or role.'
    },
    {
        path: 'add-parent',
        label: 'Adults',
        icon: <UserPlus size={18} />,
        description: 'Manage parent and adult records, link them to youth, view contact information, and maintain up-to-date guardian details for each family.'
    },
    {
        path: 'add-youth',
        label: 'Youth',
        icon: <Users size={18} />,
        description: 'View, add, edit, and manage all youth members in your group, including personal details, section, stage, and transitions.'
    },
    {
        path: 'patrol-management',
        label: 'Patrols',
        icon: <Flag size={18} />,
        description: 'Organize youth into patrols, assign Patrol Leaders (PL/APL), track patrol membership, and manage patrol details for activities and competitions.'
    }
];

export default function Members() {
    return (
        <div className="content-box">
            <PageTitle>
                <Users size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Members
            </PageTitle>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                👥 <strong>Manage your group members here.</strong><br />
                Manage all youth, adults, and patrols in your group. Easily view, add, edit, and organize member details, handle registrations, and maintain up-to-date records for everyone involved.
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {members.map((m) => (
                    <li key={m.path} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        background: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginTop: '2px', color: '#0F5BA4' }}>{m.icon}</div>
                        <div>
                            <Link
                                to={`/admin/${m.path}`}
                                style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0F5BA4', textDecoration: 'none' }}
                            >
                                {m.label}
                            </Link>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>{m.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
