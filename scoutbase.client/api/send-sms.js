// pages/api/send-sms.js

import Twilio from 'twilio';
const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { to, body } = req.body;
    if (!to || !body) {
        return res.status(400).json({ error: 'Missing "to" or "body"' });
    }

    // build the payload
    const msgOpts = { to, body };
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        msgOpts.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else {
        msgOpts.from = process.env.TWILIO_PHONE_NUMBER;
    }

    try {
        const message = await client.messages.create(msgOpts);
        res.status(200).json({ sid: message.sid });
    } catch (err) {
        console.error('Twilio Error', err);
        res.status(500).json({ error: err.message });
    }
}
