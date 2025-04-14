import styled from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  color: #111827;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
`;
export const HeaderBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .dot {
    width: 12px;
    height: 12px;
    background-color: #facc15;
    border-radius: 9999px;
  }

  .tagline {
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

export const Nav = styled.nav`
  display: none;
  gap: 1.5rem;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    display: flex;
  }

  a {
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background-color: #e5e7eb;
    color: #111827;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
      background-color: #d1d5db;
    }
  }
`;

export const Main = styled.main`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding: 4rem 2rem;
  flex-grow: 1;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
`;

export const LogoWrapper = styled.div`
  width: 12rem;
  height: 12rem;
  border-radius: 9999px;
  background-color: #0f5ba4;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: auto;
`;

export const Content = styled.div`
  text-align: center;

  @media (min-width: 768px) {
    text-align: left;
  }

  h1 {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #0F5BA4;
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  p {
    font-size: 0.95rem;
    max-width: 32rem;
    margin: 0 auto 2rem;
    line-height: 1.6;
  }
`;

export const HighlightNote = styled.p`
  font-size: 0.95rem;
  max-width: 32rem;
  margin: 0 auto 2rem;
  line-height: 1.6;
  padding: 1rem;
  border-left: 4px solid #0f5ba4;
  background-color: #e0f2fe;
  color: #0f172a;
  font-weight: 500;
`;

export const Footer = styled.footer`
  padding: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
`;

export const AdminTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;

  th, td {
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    font-size: 0.95rem;
  }

  th {
    background-color: #f9fafb;
    font-weight: 600;
    color: #374151;
  }

  tr:hover {
    background-color: #f3f4f6;
  }

  td {
    color: #111827;
  }
`;
import isPropValid from '@emotion/is-prop-valid';

export const PrimaryButton = styled.button.withConfig({
    shouldForwardProp: (prop) => isPropValid(prop) && prop !== 'isMobile',
})`
  font-size: ${({ isMobile }) => (isMobile ? '1rem' : '0.875rem')};
  padding: ${({ isMobile }) => (isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem')};
  background-color: #0F5BA4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s;

  &:hover {
    background-color: #0c4a87;
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }
`;

export const ToggleSwitchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 24px;
  }

  .toggle-switch input {
    display: none;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    background-color: #ccc;
    border-radius: 24px;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transition: background-color 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }

  input:checked + .toggle-slider {
    background-color: #0F5BA4;
  }

  input:checked + .toggle-slider::before {
    transform: translateX(26px);
  }
`;

export const AdminDropdownContainer = styled.div`
  position: relative;
`;

export const AdminDropdownMenu = styled.div`
  position: absolute;
  right: 0;
  top: 2.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  width: 280px;
  z-index: 50;
`;

export const AdminDropdownToggle = styled.button`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f3f4f6;
  }
`;

export const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

export const StyledSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  background-color: white;
`;
export const AdminHeaderRow = styled('div').withConfig({
    shouldForwardProp: (prop) => isPropValid(prop) && prop !== 'isWarning'
})`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0rem 0rem;
  gap: 1rem;
  background-color: ${({ isWarning }) => (isWarning ? '#fef3c7' : 'transparent')};
  border-bottom: 0px solid #e5e7eb;
`;
export const AdminWarningLabel = styled.div`
  background-color: #facc15;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
`;
export const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #0F5BA4;
  line-height: 1.2;
`;
