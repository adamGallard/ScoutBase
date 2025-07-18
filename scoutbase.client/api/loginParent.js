import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const normalizeMobile = (input) => input.replace(/\D+/g, '');

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // or restrict to your frontend origin
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { identifier, enteredPin, groupId } = req.body;

    if (!identifier || !enteredPin || !groupId) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const trimmed = identifier.trim();
    const isPhone = /^\d{8,}$/.test(trimmed.replace(/\s+/g, ''));

    const { data: parents, error } = await supabase
        .from('parent')
        .select('id, name, phone, pin_hash, group_id')
        .eq('group_id', groupId);

    if (error || !parents || parents.length === 0) {
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    const match = parents.find(p => {
        if (isPhone) {
            return normalizeMobile(p.phone) === normalizeMobile(trimmed);
        } else {
            return p.name?.trim().toLowerCase() === trimmed.toLowerCase();
        }
    });

    if (!match || !match.pin_hash) {
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    const isValid = await bcrypt.compare(enteredPin, match.pin_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    const payload = {
        sub: match.id, // maps to auth.uid() in RLS
        role: 'authenticated',
        app_role: 'parent',
        group_id: match.group_id
    };

    const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
        expiresIn: '4h'
    });

    return res.status(200).json({ token });
}
