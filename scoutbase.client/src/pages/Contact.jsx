import { useState } from 'react';
import {
    PageWrapper,
    Main,
    Content,
    PageTitle,
    AdminInput,
    AdminTextArea,
    PrimaryButton,
} from '@/components/common/SharedStyles';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function ContactPage() {
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
        <PageWrapper>
            <Header />
            <Main style={{ display: 'block', maxWidth: '48rem', margin: '0 auto' }}>
                <Content>
                    <PageTitle>Contact Us</PageTitle>
                    <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#374151' , width: '36rem'}}>
                        Have a question, feedback, or suggestion? We're here to help! Fill out the form below and our team
                        will get back to you within 2-3 business days.
                    </p>

                    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <label>Name</label>
                        <AdminInput
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Your name"
                            required
                        />

                        <label>Email</label>
                        <AdminInput
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="you@example.com"
                            required
                        />

                        <label>Message</label>
                        <AdminTextArea
                            value={form.message}
                            onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="Type your message here..."
                            required
                            rows={5}
                        />

                        <PrimaryButton type="submit" disabled={status === 'sending'}>
                            {status === 'sending' ? 'Sending...' : 'Send Message'}
                        </PrimaryButton>

                        {status === 'success' && <p style={{ color: 'green', marginTop: '1rem' }}>✅ Message sent!</p>}
                        {status === 'error' && <p style={{ color: 'red', marginTop: '1rem' }}>❌ Something went wrong.</p>}
                    </form>
                </Content>
            </Main>
            <Footer />
        </PageWrapper>
    );
}
