import { useState } from 'react';
import { insertAttendance } from '../helpers/supabaseHelpers';
import { getTodayDate } from '../helpers/date';

const SignInForm = ({ member, onSign, parentName, latestStatus, groupId }) => {
    const [comment, setComment] = useState('');
    const lastAction = latestStatus?.action;

    const handleSubmit = async (action) => {
        const timestamp = new Date();

        const record = {
            action,
            signed_by: parentName,
            event_date: getTodayDate(),
            timestamp: timestamp.toISOString(),
            youth_id: member.id,
            comment,
            group_id: groupId,
        };

        try {
            await insertAttendance(record);
            onSign(member.id, {
                action,
                time: timestamp.toLocaleTimeString(),
                by: parentName,
                comment,
            });
        } catch (err) {
            alert('Error saving attendance');
            console.error(err);
        }
    };

    return (
        <div className="space-y-4">
            <h2>Signing for: {member.name} ({member.section})</h2>
            <textarea
                placeholder="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                {lastAction !== 'signed in' && (
                    <button onClick={() => handleSubmit('signed in')}>Sign In</button>
                )}
                {lastAction === 'signed in' && (
                    <button onClick={() => handleSubmit('signed out')}>Sign Out</button>
                )}
            </div>
        </div>
    );
};

export default SignInForm;
