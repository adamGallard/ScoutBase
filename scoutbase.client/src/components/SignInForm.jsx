// SignInForm.jsx
// Updated for mobile responsiveness and consistent styling

import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

export default function SignInForm({ member, parentName, onSign, latestStatus, groupId }) {
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isMobile = useIsMobile();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSign(member.id, {
                comment,
                timestamp: new Date().toISOString(),
                action: latestStatus?.action === 'signed in' ? 'signed out' : 'signed in',
                group_id: groupId
            });
            setComment('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', marginTop: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Signing {latestStatus?.action === 'signed in' ? 'out' : 'in'} for: <strong>{member.name}</strong>
            </p>
            <label htmlFor="comment" style={{ display: 'block', fontWeight: 500, marginBottom: '0.25rem' }}>Comment (optional):</label>
            <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={isMobile ? 3 : 4}
                placeholder="e.g. Arrived late, leaving early..."
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    resize: 'vertical',
                    marginBottom: '1rem',
                }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
                        backgroundColor: '#ccc',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: submitting ? 0.6 : 1,
                    }}
                >
                    {latestStatus?.action === 'signed in' ? 'Sign Out' : 'Sign In'}
                </button>
            </div>
        </form>
    );
}
