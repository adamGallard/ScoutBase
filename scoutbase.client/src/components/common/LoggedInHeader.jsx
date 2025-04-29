import React, { useState } from 'react';
import styled from 'styled-components';
import { TitleGroup, HeaderBar, PrimaryButton } from '@/components/common/SharedStyles';
import { LogOut, ShieldUser, Mail } from 'lucide-react';


const Nav = styled.nav`
  display: none;
  gap: 1rem;
  align-items: center;

  @media (min-width: 768px) {
    display: flex;
  }

  a, button {
    background: none;
    border: none;
    font-size: 0.875rem;
    cursor: pointer;
    color: #0f172a;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    text-decoration: none;

    &:hover {
      background-color: #e5e7eb;
    }
  }
`;

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
  top: 3.25rem;
  right: 1rem;
  z-index: 20;

  button, a {
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #111827;
    border: none;
    background: none;
    text-align: left;

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
const CustomLinkButton = styled.a`
  background: none;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  color: #0f172a;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;

  &:hover {
    background-color: #e5e7eb;
  }
`;
export default function LoggedInHeaderBar({ parentName, onUpdatePin, onLogout  }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleUpdatePin = () => {
        console.log('🔑 Update PIN clicked');
        onUpdatePin();
    };

    const handleLogout = () => {
        console.log('🚪 Logout clicked');
        onLogout();
    };
    return (
        <HeaderBar>
            <TitleGroup>
                <span className="dot" />
                <strong>ScoutBase</strong>
                <span className="tagline">Welcome, {parentName}</span>
            </TitleGroup>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Nav>
                    
                    <button type="button" onClick={handleUpdatePin}>Update PIN</button>
                    <button type="button" onClick={handleLogout}>
                        <LogOut size={16} style={{ marginRight: '4px' }} />
                        Logout
                    </button>
                </Nav>

                <MobileMenuButton type="button" onClick={() => setMobileOpen(prev => !prev)}>
                    <HamburgerIcon><div /><div /><div /></HamburgerIcon>
                </MobileMenuButton>

                {mobileOpen && (
                    <MobileDropdown>
                                               
                        <button type="button" onClick={handleUpdatePin}>Update PIN</button>
                        <button type="button" onClick={handleLogout}>Logout</button>
                    </MobileDropdown>
                )}
            </div>
        </HeaderBar>
    );
}
