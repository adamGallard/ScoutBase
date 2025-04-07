import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getTodayDate } from '../utils/dateUtils';

export default function SignInForm({ member, onSign, parentName, latestStatus, groupId }) {
    const [comment, setComment] = useState('');
    const lastAction = latestStatus?.action;

    const handleSubmit = async (action) => {
        const timestamp = new Date();
        const data = {
            action,
            signed_by: parentName,
            event_date: getTodayDate(),
            timestamp: timestamp.toISOString(),
            youth_id: member.id,
            comment,
            group_id: groupId,
        };

        const { error } = await supabase.from('attendance').insert([data]);

        if (error) {
            alert('Error saving attendance');
            console.error(error);
        } else {
            onSign(member.id, {
                action,
                time: timestamp.toLocaleTimeString(),
                by: parentName,
                comment,
            });
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
                {lastAction !== 'signed in' && <button onClick={() => handleSubmit('signed in')}>Sign In</button>}
                {lastAction === 'signed in' && <button onClick={() => handleSubmit('signed out')}>Sign Out</button>}
            </div>
        </div>
    );
}
