import React from 'react';
import logo from '../assets/scoutbase-logo.png';
import { HighlightNote, PageWrapper, Header, TitleGroup, Nav, Main, LogoWrapper, Content } from '../components/SharedStyles';
import Footer from '../components/Footer'; // from separate file

export default function LandingPage() {
    return (
        <PageWrapper>
            <Header>
                <TitleGroup>
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#facc15', borderRadius: '9999px' }}></span>
                    <strong>ScoutBase</strong>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>Built for Scouts</span>
                </TitleGroup>
                <Nav>
                    <a href="/features">Features</a>
                    <a href="mailto:281959@scoutsqld.com.au">Contact</a>
                    <a href="/privacy">Privacy</a>
                </Nav>
            </Header>

            <Main>
                <LogoWrapper>
                    <img src={logo} alt="ScoutBase Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
                </LogoWrapper>

                <Content>
                    <h1>Hello</h1>
                    <h2>Welcome to ScoutBase</h2>
                    <p>
                        ScoutBase is your digital companion for managing attendance in the Scouts community. Built by leaders, for leaders — so you can spend less time on admin and more time outdoors.
                    </p>
                    <p>
                        <strong>👪 For Parents:</strong> Easily sign in and out your child, track event attendance, and stay connected with your Scout Group in real time.
                    </p>
                    <p>
                        <strong>🧭 For Leaders:</strong> Reduce your paperwork, improve communication with families, and generate attendance and activity reports with a single click.
                    </p>
                    <HighlightNote>
                        🔐 Please log in using the secure sign-in link provided to you by your Scout Group Leader.
                    </HighlightNote>
                </Content>
            </Main>

            <Footer />

        </PageWrapper>
    );
}
