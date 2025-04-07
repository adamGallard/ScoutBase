import bcrypt from 'bcryptjs';

export async function verifyPin(enteredPin, storedHash) {
    if (typeof storedHash !== 'string') return false;
    return await bcrypt.compare(enteredPin, storedHash);
}
