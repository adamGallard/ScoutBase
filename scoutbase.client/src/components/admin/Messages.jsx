import { Link } from 'react-router-dom';
import {
    MessageSquare,
    Megaphone,
    MessageCircle,
    Mail
} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const messages = [
    {
        path: 'notices',
        label: 'Notices',
        icon: <Megaphone size={18} />,
        description: 'Send instant notices to all parents or a selected section, which appear on their portal dashboard. Schedule, edit, and manage group-wide or section-specific announcements.'
    },
    {
        path: 'message-sms',
        label: 'SMS',
        icon: <MessageCircle size={18} />,
        description: 'Send text messages to parents or groups for urgent reminders, last-minute changes, or event updates. Includes filtering by section and message history.'
    },
    {
        path: 'message-email',
        label: 'Email',
        icon: <Mail size={18} />,
        description: 'Compose and send emails directly to parents (or open your mail app), with full group and section filtering, rich text, attachments, and easy bulk selection.'
    }
];

export default function Messages() {
    return (
        <div className="content-box">
            <PageTitle>
                <MessageSquare size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Messages
            </PageTitle>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                💬 <strong>Manage group communication.</strong><br />
                Send, schedule, and track all your group’s communications including SMS, email, and parent notices.
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {messages.map((m) => (
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
