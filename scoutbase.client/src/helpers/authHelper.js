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

export function normalizeMobile(raw = '') {
    // ensure it’s a string
    const str = typeof raw === 'string' ? raw : String(raw);
    // remove any non‑digit characters
    return str.replace(/\D+/g, '');
}


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
            return normalizeMobile(p.phone) === normalizeMobile(trimmed);
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

export const updateParentPin = async (parentId, currentPin, newPin) => {
    const { data, error } = await supabase
        .from('parent')
        .select('pin_hash')
        .eq('id', parentId)
        .single();

    if (error || !data?.pin_hash) {
        console.error('Error fetching current pin_hash:', error);
        return { success: false, error: 'Could not verify current PIN' };
    }

    const isValid = await verifyPin(currentPin, data.pin_hash);
    if (!isValid) {
        return { success: false, error: 'Current PIN is incorrect' };
    }

    const newHash = await bcrypt.hash(newPin, 10);
    const { error: updateError } = await supabase
        .from('parent')
        .update({ pin_hash: newHash })
        .eq('id', parentId);

    if (updateError) {
        console.error('Error updating PIN:', updateError);
        return { success: false, error: 'Failed to update PIN' };
    }

    return { success: true };
};

export const resetParentPin = async (parentId, newPin) => {
    const newHash = await bcrypt.hash(newPin, 10);

    const { error } = await supabase
        .from('parent')
        .update({ pin_hash: newHash })
        .eq('id', parentId);

    if (error) {
        console.error('Error resetting PIN:', error);
        return { success: false, error: 'Failed to reset PIN' };
    }

    return { success: true };
};

export function checkTokenValidity() {
    const token = localStorage.getItem('scoutbase-terrain-idtoken');
    if (!token) return false;

    const [, payload] = token.split('.');
    if (!payload) return false;

    try {
        const decoded = JSON.parse(atob(payload));
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp > now;
    } catch {
        return false;
    }
}