// /api/contact.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        const data = await resend.emails.send({
            from: 'ScoutBase Contact ', // needs to be a verified domain
            to: ['281595@scoutsqld.com.au'], // your target email
            subject: `New Contact Form Submission from ${name}`,
            reply_to: email,
            html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Resend Error:', err);
        return res.status(500).json({ error: 'Email sending failed' });
    }
}
