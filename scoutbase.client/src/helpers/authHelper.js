import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export const verifyPin = async (enteredPin, storedHash) => {
    if (typeof storedHash !== 'string') {
        console.error('Invalid storedHash:', storedHash);
        return false;
    }
    try {
        return await bcrypt.compare(enteredPin, storedHash);
    } catch (err) {
        console.error('Error comparing PIN hash:', err);
        return false;
    }
};