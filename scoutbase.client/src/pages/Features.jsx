import React from 'react';
import {
    PageWrapper,
    Main,
    Content
} from '@/components/common/SharedStyles';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';

const Features = () => (
    <PageWrapper>
        <Header />

        <Main style={{ display: 'block', maxWidth: '48rem', margin: '0 auto' }}>
            <Content>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Features</h1>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                    <li>📋 Real-time sign in/out tracking for youth members</li>
                    <li>📊 Attendance reports exportable as CSV or PDF</li>
                    <li>📱 Mobile-friendly parent interface</li>
                    <li>🧭 Leader tools for planning and tracking events</li>
                    <li>🔐 PIN-secured parent access</li>
                    <li>🛡️ Secure, role-based access to group data</li>
                    <li>📬 Automated reminders and contact management</li>
                </ul>
            </Content>
        </Main>

        <Footer />
    </PageWrapper>
);

export default Features;