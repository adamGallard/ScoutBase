import React from 'react';
import {
    PageWrapper,
    Header,
    TitleGroup,
    Nav,
    Main,
    Content
} from '../components/SharedStyles';
import Footer from '../components/Footer';

const Features = () => (
    <PageWrapper>
        <Header>
            <TitleGroup>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#facc15', borderRadius: '9999px' }}></span>
                <strong>ScoutBase</strong>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>Built for Scouts</span>
            </TitleGroup>
            <Nav>
                <a href="/">Home</a>
                <a href="mailto:281959@scoutsqld.com.au">Contact</a>
                <a href="/privacy">Privacy</a>
            </Nav>
        </Header>

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