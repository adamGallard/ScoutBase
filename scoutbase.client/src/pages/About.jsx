import styled from 'styled-components';
import {
    PageWrapper,
    Content,
    PageTitle,
    Main,
} from '@/components/common/SharedStyles';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const AboutSection = styled.section`
  padding: 4rem 2rem;
  background-color: #ffffff;
  color: #0f172a;
  font-family: sans-serif;
  max-width: 75rem;
  margin: 0 auto;
`;

const Paragraph = styled.p`
  font-size: 1rem;
  line-height: 1.75;
  margin-bottom: 1.5rem;
  color: #374151;
`;

const Emphasis = styled.span`
  font-weight: bold;
  color: #0F5BA4;
`;

export default function About() {
    return (
        <PageWrapper>
            <Header />
            <Main style={{ display: 'block' }}>

                    <Content>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>About ScoutBase</h1>

                        <Paragraph>
                            <Emphasis>ScoutBase</Emphasis> was created by volunteer Scout leaders who saw a need for a better way to manage
                            youth sign-ins, patrol organization, and attendance tracking at the group level.
                        </Paragraph>

                        <Paragraph>
                            We believe in keeping things simple, secure, and tailored to the way Scout groups operate. That means:
                            minimal training, mobile-friendly design, and respecting parents' privacy while keeping leaders organized.
                        </Paragraph>

                        <Paragraph>
                            Built with real-world feedback from active Scout groups, ScoutBase helps you spend less time on admin
                            and more time delivering great programs.
                        </Paragraph>

                        <Paragraph>
                            Whether you're a <Emphasis>Group Leader</Emphasis>, <Emphasis>Section Leader</Emphasis>, or a parent just trying
                            to remember where the drop-off is - ScoutBase is here to help.
                        </Paragraph>

                        <Paragraph>
                            Have questions or feedback? Reach out via our <a href="/contact" style={{ color: '#0F5BA4' }}>Contact page</a> - we'd love to hear from you!
                        </Paragraph>
                    </Content>

            </Main>
            <Footer />
        </PageWrapper>
    );
}