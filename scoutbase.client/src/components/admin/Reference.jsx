import { Link } from 'react-router-dom';
import {
    BookOpen,
    QrCode,
    Tent
} from 'lucide-react';
import { PageTitle } from '@/components/common/SharedStyles';

const references = [
    {
        path: 'qr-code',
        label: 'QR Code',
        icon: <QrCode size={18} />,
        description: 'Instantly generate and display group-specific QR codes for parent sign-in or family registration. Parents can scan these codes to quickly sign in at meetings or register new families.'
    },
    {
        path: 'oas-ref',
        label: 'OAS',
        icon: <Tent size={18} />,
        description: 'Explore the complete Outdoor Adventure Skills (OAS) library. Search and filter requirements by activity, substream, stage, and category. Download skills lists as CSV for offline use.'
    }
];

export default function Reference() {
    return (
        <div className="content-box">
            <PageTitle>
                <BookOpen size={25} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />Reference
            </PageTitle>
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f4f8',
                borderRadius: '8px',
                fontSize: '0.95rem',
                color: '#333'
            }}>
                📚 <strong>Reference tools and resources.</strong><br />
                Browse practical scouting resources, including the full Outdoor Adventure Skills (OAS) library and printable QR codes for parent sign-in or family registration.
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {references.map((r) => (
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
