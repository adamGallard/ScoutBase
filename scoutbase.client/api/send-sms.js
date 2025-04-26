// pages/api/send-sms.js
import Twilio from 'twilio';

const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
    // 1) Always set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 2) Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3) Only accept POST
    if (req.method !== 'POST') {
        return res
            .status(405)
            .json({ error: 'Method Not Allowed' });
    }

    const { to, body } = req.body || {};
    if (!to || !body) {
        return res
            .status(400)
            .json({ error: 'Missing "to" or "body" in request' });
    }

    try {
        const msg = await client.messages.create({
            to,
            body,
            ...(process.env.TWILIO_MESSAGING_SERVICE_SID
                ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
                : { from: process.env.TWILIO_PHONE_NUMBER })
        });

        return res
            .status(200)
            .json({ sid: msg.sid });
    } catch (error) {
        console.error('Twilio error:', error);
        return res
            .status(500)
            .json({ error: error.message || 'Internal Server Error' });
    }
}
