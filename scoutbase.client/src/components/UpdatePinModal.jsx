import { useState } from 'react';
import styled from 'styled-components';
import { updateParentPin } from '@/helpers/authHelper';
import { logAuditEvent } from "@/helpers/auditHelper";

export default function UpdatePinModal({ isOpen, onClose, parentId, groupId }) {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleUpdate = async () => {
        setError('');


        if (!/^\d{4}$/.test(newPin)) {
            setError('PIN must be exactly 4 numeric digits');
            return;
        }

        const weakPins = ['0000', '1234', '1111', '2222', '4321'];
        if (weakPins.includes(newPin)) {
            setError('Please choose a less predictable PIN');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match.');
            return;
        }

        const result = await updateParentPin(parentId, currentPin, newPin);
        if (!result.success) {
            setError(result.error || 'Failed to update PIN.');
        } else {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
            }, 1500);
            await logAuditEvent({
                userId: parentId,             // the parent changing their own PIN
                groupId: groupId,             // passed down or grabbed from SignInOutPage
                role: 'parent',
                action: 'update_pin',
                targetType: 'parent',
                targetId: parentId,
                metadata: { source: 'self-service' }
            });
        }
    };

    return (
        <ModalOverlay>
            <ModalBox>
                <h3>Update Your PIN</h3>
                <p>Please enter your current PIN and your new one below:</p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdate();
                    }}
                >
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Current PIN"
                        value={currentPin}
                        maxLength={4}
                        onChange={(e) => setCurrentPin(e.target.value)}
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="New PIN"
                        value={newPin}
                        maxLength={4}
                        onChange={(e) => setNewPin(e.target.value)}
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Confirm New PIN"
                        value={confirmPin}
                        maxLength={4}
                        onChange={(e) => setConfirmPin(e.target.value)}
                    />
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {success && <p style={{ color: 'green' }}>PIN updated successfully!</p>}
                    <ButtonRow>
                        <button type="submit">Update</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </ButtonRow>
                </form>
            </ModalBox>
        </ModalOverlay>
    );
}
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

  p {
    font-size: 0.95rem;
    margin-bottom: 1rem;
    color: #333;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    margin: 0.5rem 0;
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
  margin-top: 1rem;
`;
