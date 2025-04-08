import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../lib/supabaseClient';

export default function PinModal({ parentId, onClose, groupId }) {
    const [newPin, setNewPin] = useState('');
    const [error]= useState('');
    const [loading] = useState(false);

    const handleSave = async () => {
        if (!newPin || newPin.length !== 4) {
            alert('Please enter a 4-digit PIN');
            return;
        }

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(newPin, salt);

            const { error } = await supabase
                .from('parent')
                .update({ pin_hash: hashedPin })
                .eq('id', parentId)
                .eq('group_id', groupId); // Optional, but good to include

            if (error) {
                console.error('Error saving pin:', error);
                alert('Could not save PIN');
            } else {
                onClose();
            }
        } catch (err) {
            console.error('Hashing or update failed:', err);
            alert('Something went wrong while saving PIN');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
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
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={handleSave} disabled={loading}>Save</button>
                    <button onClick={onClose} disabled={loading}>Cancel</button>
                </div>
            </div>
        </div>
    );
}