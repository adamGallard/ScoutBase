import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { updateParentPin } from '@/helpers/authHelper';

export default function UpdatePinModal({ isOpen, onClose, parentId }) {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleUpdate = async () => {
        setError('');
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
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-30 p-4">
                <Dialog.Panel className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
                    <Dialog.Title className="text-xl font-semibold mb-4">Update PIN</Dialog.Title>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdate();
                        }}
                    >
                        <input
                            type="password"
                            placeholder="Current PIN"
                            className="w-full border rounded p-2"
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="New PIN"
                            className="w-full border rounded p-2"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New PIN"
                            className="w-full border rounded p-2"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                        />

                        {error && <p className="text-red-600">{error}</p>}
                        {success && <p className="text-green-600">PIN updated successfully!</p>}

                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Update</button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
