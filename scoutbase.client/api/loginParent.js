import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const normalizeMobile = (input) => input.replace(/\D+/g, '');

export default async function handler(req, res) {
    console.log("🔔 loginParent API called");
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    const allowedOrigins = ['https://dev.scoutbase.app'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { identifier, enteredPin, groupId } = req.body;



    if (!identifier || !enteredPin || !groupId) {

        return res.status(400).json({ error: 'Missing fields' });
    }

    const trimmed = identifier.trim();
    const isPhone = /^\d{8,}$/.test(trimmed.replace(/\s+/g, ''));

    // STEP 1: Fetch candidates
    const { data: parents, error } = await supabase
        .from('parent')
        .select('id, name, phone, pin_hash, group_id, failed_attempts, locked')
        .eq('group_id', groupId);

    if (error) {

        return res.status(500).json({ error: 'Database error' });
    }

    if (!parents || parents.length === 0) {

        return res.status(401).json({ error: 'Invalid name or PIN' });
    }



    // STEP 2: Find matching parent
    const match = parents.find(p =>
        isPhone
            ? normalizeMobile(p.phone) === normalizeMobile(trimmed)
            : p.name?.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!match) {

        return res.status(401).json({ error: 'Invalid name or PIN' });
    }


    if (!match.pin_hash) {

        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    if (match.locked) {

        return res.status(403).json({
            error: 'Account locked after 5 failed attempts. Please contact a leader.',
        });
    }

    // STEP 3: Compare PIN
    const isValid = await bcrypt.compare(enteredPin, match.pin_hash);

    if (!isValid) {
        const attempts = (match.failed_attempts || 0) + 1;
        const locked = attempts >= 5;



        const { error: updateError } = await supabase
            .from('parent')
            .update({ failed_attempts: attempts, locked })
            .eq('id', match.id);

        return res.status(401).json({
            error: locked
                ? 'Account locked after 5 failed attempts. Please contact a leader.'
                : `Incorrect PIN. ${5 - attempts} attempt(s) left.`,
        });
    }

    // STEP 4: Successful login


    const { error: resetError } = await supabase
        .from('parent')
        .update({ failed_attempts: 0 })
        .eq('id', match.id);


    const payload = {
        sub: match.id,
        role: 'authenticated',
        app_role: 'parent',
        group_id: match.group_id,
    };

    const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
        expiresIn: '4h',
    });

    return res.status(200).json({
        token,
        parent: {
            id: match.id,
            name: match.name,
            phone: match.phone,
            group_id: match.group_id,
        },
    });
}
