import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

console.log('SUPABASE_URL loaded:', process.env.SUPABASE_URL);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const normalizeMobile = (input) => input.replace(/\D+/g, '');

app.post('/api/loginParent', async (req, res) => {
    console.log('🔔 [POST] /api/loginParent', req.body);

    const { identifier, enteredPin, groupId } = req.body;
    if (!identifier || !enteredPin || !groupId) {
        console.warn('⚠️ Missing login fields');
        return res.status(400).json({ error: 'Missing fields' });
    }

    const trimmed = identifier.trim();
    const isPhone = /^\d{8,}$/.test(trimmed.replace(/\s+/g, ''));

    // Fetch all parents in group with auth fields
    const { data: parents, error } = await supabase
        .from('parent')
        .select('id, name, phone, pin_hash, group_id, failed_attempts, locked')
        .eq('group_id', groupId);

    if (error) {
        console.error('❌ Error fetching parents:', error);
        return res.status(500).json({ error: 'Database error' });
    }

    if (!parents || parents.length === 0) {
        console.warn('⚠️ No parents found in group');
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    const match = parents.find(p =>
        isPhone
            ? normalizeMobile(p.phone) === normalizeMobile(trimmed)
            : p.name?.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!match) {
        console.warn('❌ No matching parent found');
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    console.log(`🔍 Attempting login for ${match.name} (${match.phone})`);

    if (!match.pin_hash) {
        console.warn('❌ No stored hash for PIN');
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    if (match.locked) {
        console.warn('🔒 Account is locked');
        return res.status(403).json({
            error: 'Account locked after 5 failed attempts. Please contact a leader.',
        });
    }

    const isValid = await bcrypt.compare(enteredPin, match.pin_hash);

    if (!isValid) {
        const attempts = (match.failed_attempts || 0) + 1;
        const locked = attempts >= 5;

        console.warn(`❌ Invalid PIN - attempts: ${attempts}`);

        const { error: updateError } = await supabase
            .from('parent')
            .update({ failed_attempts: attempts, locked })
            .eq('id', match.id);

        if (updateError) {
            console.error('⚠️ Error updating failed_attempts:', updateError);
        } else {
            console.log(`📌 Updated failed_attempts=${attempts}, locked=${locked}`);
        }

        return res.status(401).json({
            error: locked
                ? 'Account locked after 5 failed attempts. Please contact a leader.'
                : `Incorrect PIN. ${5 - attempts} attempt(s) left.`,
        });
    }

    // ✅ Valid PIN
    console.log(`✅ Successful login for ${match.name}`);

    const { error: resetError } = await supabase
        .from('parent')
        .update({ failed_attempts: 0 })
        .eq('id', match.id);

    if (resetError) {
        console.warn('⚠️ Failed to reset failed_attempts:', resetError);
    }

    const token = jwt.sign(
        {
            sub: match.id,
            role: 'authenticated',
            app_role: 'parent',
            group_id: match.group_id
        },
        process.env.SUPABASE_JWT_SECRET,
        { expiresIn: '4h' }
    );

    return res.json({
        token,
        parent: {
            id: match.id,
            name: match.name,
            phone: match.phone,
            group_id: match.group_id
        }
    });
});

app.listen(3001, () => {
    console.log('🚀 Local API server running at http://localhost:3001');
});
