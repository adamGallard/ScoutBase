import { useState } from 'react';
import {
    AdminInput,
    AdminTextArea,
    PrimaryButton,
    PageTitle,
} from '@/components/common/SharedStyles';
import { Mail, ExternalLink } from 'lucide-react';

export default function AdminContactPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            setStatus('success');
            setForm({ name: '', email: '', message: '' });
        } else {
            setStatus('error');
        }
    };

    return (
        <div className="content-box" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <Mail size={24} style={{ color: '#0F5BA4', marginRight: 8 }} />
                <PageTitle style={{ margin: 0 }}>Contact Support</PageTitle>
            </div>

            <p style={{ marginBottom: '1.5rem', color: '#374151' }}>
                Need help with ScoutBase, found an issue, or have suggestions? Use this form to report bugs,
                share feedback, or ask questions. Our team will review your message and respond within 2–3 business days.
            </p>

            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Name</label>
                <AdminInput
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    required
                />

                <label htmlFor="email">Email</label>
                <AdminInput
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                />

                <label htmlFor="message">Message</label>
                <AdminTextArea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Type your message here..."
                    rows={5}
                    required
                />

                <PrimaryButton type="submit" disabled={status === 'sending'} style={{ marginTop: '1rem' }}>
                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                </PrimaryButton>

                {status === 'success' && (
                    <p style={{ color: '#059669', marginTop: '1rem' }}>✅ Message sent!</p>
                )}
                {status === 'error' && (
                    <p style={{ color: '#dc2626', marginTop: '1rem' }}>❌ Something went wrong.</p>
                )}
            </form>

            <hr style={{ margin: '2.5rem 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />

            <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0F5BA4' }}>
                    Related Links
                </h3>
                <p style={{ marginBottom: '0.75rem' }}>
                    View known issues and feature requests:
                </p>
                <a
                    href="https://github.com/adamGallard/ScoutBase/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#0F5BA4',
                        fontWeight: 500,
                        textDecoration: 'none',
                    }}
                >
                    Open Issue Log <ExternalLink size={16} style={{ marginLeft: 8 }} />
                </a>
            </div>
        </div>
    );
}
