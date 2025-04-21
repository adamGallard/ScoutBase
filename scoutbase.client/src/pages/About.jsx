// src/pages/About.jsx

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
  padding: 1rem 1rem;
  color: #0f172a;
  font-family: sans-serif;
  max-width: 30rem;
  margin: 0 auto 2rem;
  text-align: center;
`;

const IntroParagraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.75;
  margin: 0 ;
  color: #374151;
    text-align: center;
`;

const FeatureBlock = styled.div`
  display: flex;
  flex-direction: ${({ isReversed }) => (isReversed ? 'row-reverse' : 'row')};
  align-items: center;
  gap: 2rem;
  margin: 3rem 0;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FeatureText = styled.div`
  flex: 1;
`;

const FeatureImage = styled.img`
  flex: 1;
  max-width: 300px;
  border-radius: 8px;
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
                <Content style={{ maxWidth: '60rem', margin: '0 auto' }}>
                    <AboutSection>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>About ScoutBase</h1>

                    <IntroParagraph>
                            <Emphasis>ScoutBase</Emphasis> was created by volunteer Scout leaders who saw a need for a better way to manage youth sign-ins, patrol organization, and attendance tracking at the group level.
                     </IntroParagraph>
                    </AboutSection>
                    <FeatureBlock>
                        <FeatureImage src="/images/about-1.png" alt="Simple and Secure" />
                        <FeatureText>
                            <PageTitle>Simple and Secure</PageTitle>
                            <p>
                                ScoutBase uses secure authentication and permission controls so that only authorized leaders can access sign-in and attendance data. The user interface is designed to be intuitive and mobile-friendly, allowing quick check-ins and updates on the go.
                            </p>
                        </FeatureText>
                    </FeatureBlock>

                    <FeatureBlock isReversed>
                        <FeatureImage src="/images/about-2.png" alt="Built for Scouts" />
                        <FeatureText>
                            <PageTitle>Built by Scouts, for Scouts</PageTitle>
                            <p>
                                Developed in collaboration with Scout groups, ScoutBase reflects real-world workflows. We’ve incorporated direct feedback from leaders to ensure the app supports common tasks like roll calls and patrol coordination without unnecessary features.
                            </p>
                        </FeatureText>
                    </FeatureBlock>

                    <FeatureBlock>
                        <FeatureImage src="/images/about-3.png" alt="For Everyone" />
                        <FeatureText>
                            <PageTitle>Designed for Everyone</PageTitle>
                            <p>
                                Whether you’re a Group Leader, Section Leader, or a parent checking schedules, ScoutBase offers role-based views to present relevant information. Parents can see pick-up details and event notices, while leaders manage attendance and patrol assignments.
                            </p>
                        </FeatureText>
                    </FeatureBlock>

                    <FeatureBlock isReversed>
                        <FeatureImage src="/images/about-4.png" alt="We Listen" />
                        <FeatureText>
                            <PageTitle>We Listen</PageTitle>
                            <p>
                                Your feedback guides our development. Visit our <a href="/contact" style={{ color: '#0F5BA4', textDecoration: 'underline' }}>Contact page</a> to submit comments or feature requests, and help us prioritize improvements that matter most to your troop.
                            </p>
                        </FeatureText>
                    </FeatureBlock>
                </Content>
            </Main>
            <Footer />
        </PageWrapper>
    );
}