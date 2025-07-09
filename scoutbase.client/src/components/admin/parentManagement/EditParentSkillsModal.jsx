// components/admin/parents/EditParentSkillsModal.jsx

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/common/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';

export default function EditParentSkillsModal({ parent, onClose, groupId, userInfo, onSave }) {
    const [skills, setSkills] = useState(parent.skills || '');
    const [interests, setInterests] = useState(parent.interests_hobbies || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setError('');
        setLoading(true);

        // Optional: add simple validation
        if (skills.trim().length === 0 && interests.trim().length === 0) {
            setError('Please enter at least one skill or interest.');
            setLoading(false);
            return;
        }

        const { data, error: supabaseError } = await supabase
            .from('parent')
            .update({
                skills,
                interests_hobbies: interests,
            })
            .eq('id', parent.id)
            .eq('group_id', groupId)
            .select()
            .single();

        setLoading(false);

        if (supabaseError) {
            setError(supabaseError.message || 'Could not save changes.');
        } else {
            await logAuditEvent({
                userId: userInfo?.id || null,
                groupId: groupId,
                role: userInfo?.role,
                action: 'skills_update',
                targetType: 'parent',
                targetId: parent.id,
                metadata: `Updated skills/interests for parent: ${parent.name}`,
            });
            if (onSave) onSave(data);
            onClose();
        }
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Edit Skills & Interests</h3>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>
                    {parent?.name ? `Parent: ${parent.name}` : 'Parent'}
                </div>
                <label style={{ fontWeight: 600 }}>Skills</label>
                <textarea
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. First Aid, Cooking, Woodwork"
                    style={{ width: '100%', minHeight: 60, marginBottom: 8 }}
                    disabled={loading}
                />
                <label style={{ fontWeight: 600 }}>Interests & Hobbies</label>
                <textarea
                    value={interests}
                    onChange={e => setInterests(e.target.value)}
                    placeholder="e.g. Camping, Cycling, Music"
                    style={{ width: '100%', minHeight: 60, marginBottom: 8 }}
                    disabled={loading}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <ButtonRow>
                    <button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );

}
