import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';
import { ModalOverlay, ModalBox, ButtonRow } from '@/components/SharedStyles';
import { logAuditEvent } from '@/helpers/auditHelper';

export default function PinModal({ parentId, onClose, groupId , userInfo }) {
    const [newPin, setNewPin] = useState('');
    const [error] = useState('');
    const [loading] = useState(false);


    const handleSave = async () => {

        const weakPins = ['0000', '1234', '1111', '2222', '4321'];
        if (weakPins.includes(newPin)) {
            alert('Please choose a less predictable PIN');
            return;
        }


        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(newPin, salt);

            const { error } = await supabase
                .from('parent')
                .update({ pin_hash: hashedPin })
                .eq('id', parentId)
                .eq('group_id', groupId);

            if (error) {
                console.error('Error saving pin:', error);
                alert('Could not save PIN');
            } else {

                await logAuditEvent({
                    userId: userInfo?.id || null,
                    groupId: groupId,
                    role: userInfo?.role,
                    action: 'pin_update',
                    targetType: 'parent',
                    targetId: parentId,
                    metadata: `Reset PIN for parent ID: ${parentId}`
                });

                onClose();
            }
        } catch (err) {
            console.error('Hashing or update failed:', err);
            alert('Something went wrong while saving PIN');
        }
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Update PIN</h3>
                <p>Enter a new 4-digit PIN for this parent:</p>
                <input
                    type="password"
                    value={newPin}
                    maxLength={4}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    disabled={loading}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <ButtonRow>
                    <button onClick={handleSave} disabled={loading}>Save</button>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                </ButtonRow>
            </ModalBox>
        </ModalOverlay>
    );
}

