// /pages/api/send-email.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST allowed' });
    }

    const { to = [], subject, message } = req.body;
    if (!to.length || !subject || !message) {
        return res.status(400).json({ error: 'Missing to, subject or message' });
    }

    try {
        await resend.emails.send({
            from: 'ScoutBase Admin <noreply@scoutbase.app>',
            to: 'noreply@scoutbase.app',
            bcc: to,
            reply_to: process.env.DEFAULT_REPLY_TO || 'cubs@belmont.scoutsqld.com.au',
            subject,
            html: message.replace(/\n/g, '<br>'),
        });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Resend Error:', err);
        return res.status(500).json({ error: 'Email sending failed' });
    }
}
