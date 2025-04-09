import React from 'react';
import {
    PageWrapper,
    Header,
    TitleGroup,
    Nav,
    Main,
    Content,
} from '../components/SharedStyles';
import Footer from '../components/Footer'; // from separate file

const Privacy = () => (
    <PageWrapper>
        <Header>
            <TitleGroup>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#facc15', borderRadius: '9999px' }}></span>
                <strong>ScoutBase</strong>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>Built for Scouts</span>
            </TitleGroup>
            <Nav>
                <a href="/">Home</a>
                <a href="/features">Features</a>
                <a href="mailto:281959@scoutsqld.com.au">Contact</a>
            </Nav>
        </Header>

        <Main style={{ display: 'block', maxWidth: '48rem', margin: '0 auto' }}>
            <Content>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Privacy Policy</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>1. Introduction</h2>
                <p>
                    ScoutBase is committed to protecting your privacy. We only collect and store the data we need to deliver a safe,
                    efficient, and helpful attendance system for Scout Groups and their members.
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>2. What We Collect</h2>
                <ul style={{ marginLeft: '1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                    <li>Names of youth members and parents</li>
                    <li>Contact information (email, phone)</li>
                    <li>Attendance records for events and meetings</li>
                    <li>Group and section associations</li>
                </ul>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>3. How We Use Your Data</h2>
                <p>
                    This data is used strictly for the purposes of attendance tracking, parent communications, and group
                    administration. We do not use your data for marketing or any third-party services.
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>4. Data Sharing</h2>
                <p>
                    Your data is never sold or shared with third parties. Only ScoutBase system administrators and verified leaders
                    in your Scout Group can access your data.
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>5. Security</h2>
                <p>
                    All data is stored securely on our platform with access restricted to authenticated users. We use encryption
                    protocols and secure login procedures to protect your information.
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>6. Your Rights</h2>
                <p>
                    You have the right to request a copy of your data, correct any inaccuracies, or request removal of your data from
                    our system. Please contact us at <a href="mailto:support@scoutbase.app" style={{ color: '#0f5ba4' }}>support@scoutbase.app</a> for assistance.
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '2rem 0 0.5rem' }}>7. Contact</h2>
                <p>
                    If you have any concerns about how we handle your data, please email us at <a href="mailto:support@scoutbase.app" style={{ color: '#0f5ba4' }}>support@scoutbase.app</a>. We're
                    happy to help.
                </p>
            </Content>
        </Main>

        <Footer />
    </PageWrapper>
);

export default Privacy;