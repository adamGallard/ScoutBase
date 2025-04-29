// SignInForm.jsx
// Updated for mobile responsiveness and consistent styling

import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
    PageWrapper,
    Main,
    Content,
    LogoWrapper,
PrimaryButton
} from '@/components/common/SharedStyles';

export default function SignInForm({ member, parentName, onCancel, onSign, latestStatus, groupId }) {
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
                <PrimaryButton isMobile={isMobile}
                    type="submit"
                    disabled={submitting}

                >
                    {latestStatus?.action === 'signed in' ? 'Sign Out' : 'Sign In'}
                </PrimaryButton>

                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        backgroundColor: '#ccc',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                    }}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
