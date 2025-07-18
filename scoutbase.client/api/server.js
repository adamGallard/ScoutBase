import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // loads automatically from .env, .env.local, etc.

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
    console.log('POST /api/loginParent', req.body);
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

    const match = parents.find(p =>
        isPhone
            ? normalizeMobile(p.phone) === normalizeMobile(trimmed)
            : p.name?.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (!match || !match.pin_hash) {
        return res.status(401).json({ error: 'Invalid name or PIN' });
    }

    const isValid = await bcrypt.compare(enteredPin, match.pin_hash);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid name or PIN' });
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
            phone: match.phone
        }
    });
});
app.listen(3001, () => {
    console.log('API server running on http://localhost:3001');
});
