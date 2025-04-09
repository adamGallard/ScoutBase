import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export const verifyPin = async (enteredPin, storedHash) => {
    if (typeof storedHash !== 'string') return false;
    try {
        return await bcrypt.compare(enteredPin, storedHash);
    } catch (err) {
        console.error('Error comparing PIN hash:', err);
        return false;
    }
};

const normalizeMobile = (input) => input.replace(/\D/g, '');

export const verifyParentByIdentifierAndPin = async (identifier, enteredPin, groupId) => {
    const trimmed = identifier.trim();
    const isPhone = /^\d{8,}$/.test(trimmed.replace(/\s+/g, ''));

    const { data, error } = await supabase
        .from('parent')
        .select('*')
        .eq('group_id', groupId);

    if (error || !data || data.length === 0) {
        console.error('Supabase error or no data:', error);
        return { success: false, error: 'Invalid name or PIN' };
    }

    const match = data.find(p => {
        if (isPhone) {
            return normalizeMobile(p.mobile) === normalizeMobile(trimmed);
        } else {
            return p.name?.trim().toLowerCase() === trimmed.toLowerCase();
        }
    });

    if (!match || !match.pin_hash || typeof match.pin_hash !== 'string') {
        return { success: false, error: 'Invalid name or PIN' };
    }

    const isValid = await verifyPin(enteredPin, match.pin_hash);
    if (!isValid) {
        return { success: false, error: 'Invalid name or PIN' };
    }

    return { success: true, parent: match };
};
