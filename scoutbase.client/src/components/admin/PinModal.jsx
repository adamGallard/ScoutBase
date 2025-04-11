import { useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

export default function PinModal({ parentId, onClose, groupId }) {
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

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-family: sans-serif; 
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #111827;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    margin: 1rem 0;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #111827;
  }

  button {
    padding: 0.5rem 1rem;
    font-weight: 600;
    background: #0F5BA4;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;

    &:hover {
      background: #0c4784;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;


const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;
