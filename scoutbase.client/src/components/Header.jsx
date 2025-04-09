import React, { useState } from 'react';
import styled from 'styled-components';
import { TitleGroup, Nav, HeaderBar } from '../components/SharedStyles';
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

            {/* Desktop Navigation */}
            <Nav>
                <a href="/">Home</a>
                <a href="/features">Features</a>
                <a href="mailto:281595@scoutsqld.com.au">Contact</a>
                <a href="/privacy">Privacy</a>
                <a href="/admin-login">Admin Area</a>
            </Nav>

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
                    <a href="mailto:281595@scoutsqld.com.au">Contact</a>
                    <a href="/privacy">Privacy</a>
                </MobileDropdown>
            )}
        </HeaderBar>
    );
};

export default Header;
