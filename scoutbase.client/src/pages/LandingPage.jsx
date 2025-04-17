import React from 'react';
import logo from '../assets/scoutbase-logo.png';
import {
    HighlightNote,
    PageWrapper,
    Main,
    LogoWrapper,
    Content,
    StyledLogo,
} from '../components/SharedStyles';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet';

export default function LandingPage() {
    return (
        <PageWrapper>
            <Helmet>
                <title>Welcome to ScoutBase</title>
            </Helmet>

            <Header />

            <Main>
                <LogoWrapper>
                    <StyledLogo src={logo} alt="ScoutBase Logo" />
                </LogoWrapper>

                <Content>
                    <h1>Welcome to ScoutBase</h1>
                    <h2>Your Digital Scouting Companion</h2>

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
