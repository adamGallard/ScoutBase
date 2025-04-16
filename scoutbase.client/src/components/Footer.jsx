import React from 'react';
import styled from 'styled-components';
import { appVersion } from '../version';

const FooterWrapper = styled.footer`
  width: 100%;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 2rem;
`;

const FooterContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Section = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FooterLink = styled.a`
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;

  &:hover {
    color: #111827;
  }
`;

const SmallText = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const Footer = () => (
    <FooterWrapper>
        <FooterContainer>
            <Section>
                <strong style={{ color: '#374151' }}>ScoutBase</strong>
            </Section>

            <Section>
                <FooterLink href="mailto:281595@scoutsqld.com.au">Support</FooterLink>
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
            </Section>

            <SmallText>
                <span>&copy; {new Date().getFullYear()}</span> ScoutBase &middot; v{appVersion.version}
            </SmallText>
        </FooterContainer>
    </FooterWrapper>
);

export default Footer;
