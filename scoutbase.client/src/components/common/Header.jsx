import React, { useState } from 'react';
import styled from 'styled-components';
import { TitleGroup, Nav, HeaderBar } from '@/components/common/SharedStyles';
import { ShieldUser } from 'lucide-react';
const MobileMenuButton = styled.button`
  display: flex;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: auto;

  @media (min-width: 768px) {
    display: none;
  }
`;
const MobileDropdown = styled.div`
  display: flex;
  flex-direction: column;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  position: absolute;
  top: 3.25rem; /* or adjust slightly if needed */
  right: 1rem;
  z-index: 20;

  a {
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #111827;
    border-radius: 6px;

    &:hover {
      background-color: #e5e7eb;
    }
  }
`;
const HamburgerIcon = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 1rem;
  width: 1.5rem;

  div {
    height: 2px;
    background: #111827;
    border-radius: 2px;
  }
`;


const Header = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <HeaderBar>
            <TitleGroup>
                <span className="dot" />
                <strong>ScoutBase</strong>
                <span className="tagline">Built for Scouts</span>
            </TitleGroup>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginLeft: 'auto'
            }}>
            {/* Desktop Navigation */}
            <Nav>
                <a href="/">Home</a>
                    <a href="/features">Features</a>
					<a href="/about">About</a>
                <a href="/contact">Contact</a>
                <a href="/privacy">Privacy</a>
            </Nav>
           
                <a href="/admin-login"> <ShieldUser size={25} color="#0F5BA4" /></a>

            </div>
            {/* Mobile Nav Toggle */}
            <MobileMenuButton onClick={() => setMobileNavOpen(prev => !prev)}>
                <HamburgerIcon>
                    <div />
                    <div />
                    <div />
                </HamburgerIcon>
            </MobileMenuButton>

            {/* Mobile Dropdown */}
            {mobileNavOpen && (
                <MobileDropdown>
                    <a href="/">Home</a>
                    <a href="/features">Features</a>
                    <a href="/contact">Contact</a>
                    <a href="/privacy">Privacy</a>
                </MobileDropdown>
            )}
        </HeaderBar>
    );
};

export default Header;
