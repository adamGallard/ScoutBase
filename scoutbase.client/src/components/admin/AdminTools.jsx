import { Link } from 'react-router-dom';
import {
    Shield,
    User,
    Settings,
    FolderSymlink,
    MapPin,
    FileText, IdCardLanyard 

} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const adminTools = [
    {
        path: 'user-management',
        label: 'Users',
        icon: <User size={18} />,
        description: 'Add, edit, or remove users with group and section roles. Assign permissions, update email addresses, and manage leader access for your Scout group. All actions are audited for accountability.'
    },
    {
        path: 'settings',
        label: 'Group Settings',
        icon: <Settings size={18} />,
        description: 'Adjust group-specific settings including names, Twilio SMS configuration, parent sign-in requirements, and more. Settings control the groups operation and available features.'
    },
    {
        path: 'parent-header-links',
        label: 'Parent Links',
        icon: <FolderSymlink size={18} />,
        description: 'Add and manage quick-access links for parents on the sign-in page. Control the titles, URLs, and descriptions of resources shown to families, making it easy to share forms, calendars, or important information.'
    },
     {
        path: 'group-roles',
        label: 'Group Roles',
        icon: <IdCardLanyard size={18} />,
        description: 'Manage the list of available adult and leader roles for your group. Add, edit, or remove roles to keep your team structure up to date.'
    },
    {
        path: 'audit-log',
        label: 'Audit Log',
        icon: <FileText size={18} />,
        description: 'Review a full audit log of all admin activity and changes in the database. Track edits, deletions, user logins, and data exports for compliance and transparency.'
    }

];

export default function AdminTools() {
    return (
        <div className="content-box">
            <PageTitle>
                <Shield size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Admin Tools
            </PageTitle>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                🛡️ <strong>Administration tools and settings.</strong><br />
                Manage all aspects of your group’s administration, including users, groups, settings, and audit logs. This section provides leaders and super admins with the controls needed to oversee security, customize group operations, and ensure accountability across the system.
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {adminTools.map((t) => (
                    <li key={t.path} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        background: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginTop: '2px', color: '#0F5BA4' }}>{t.icon}</div>
                        <div>
                            <Link
                                to={`/admin/${t.path}`}
                                style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#0F5BA4', textDecoration: 'none' }}
                            >
                                {t.label}
                            </Link>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#555' }}>{t.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
