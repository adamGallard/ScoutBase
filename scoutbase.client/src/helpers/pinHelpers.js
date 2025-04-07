import bcrypt from 'bcryptjs';

export const verifyPin = async (enteredPin, storedHash) => {
    if (typeof storedHash !== 'string') return false;
    return await bcrypt.compare(enteredPin, storedHash);
};
