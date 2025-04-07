import { supabase } from '../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export const authenticateParent = async (searchTerm, pin) => {
    const { data, error } = await supabase
        .from('parent')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

    if (error || !data || data.length === 0) {
        return { isValid: false, error: 'Invalid name or PIN.' };
    }

    const found = data[0];
    const isValid = await bcrypt.compare(pin, found.pin_hash);

    return { isValid, parentData: found, error: isValid ? null : 'Invalid name or PIN.' };
};