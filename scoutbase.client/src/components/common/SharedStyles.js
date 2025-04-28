import styled from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 98vh;
  background-color: #f9fafb;
  color: #111827;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  marginBottom: '1rem',
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
  width: 18rem;
  height: 18rem;
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
    margin: 0 0 2rem;
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
margin: 0.25rem 0.5rem;

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
   border-radius: 50px;
  justify-content: flex-end;
  align-items: center;
  padding: 0.25rem 0.25rem 0.25rem 1rem;
  gap: 1rem;
  background-color: ${({ isWarning }) => (isWarning ? '#fef3c7' : 'transparent')};
  border-bottom: 0px solid #e5e7eb;
`;
export const AdminWarningLabel = styled.div`
  background-color: #facc15;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
`;
export const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #0F5BA4;
  line-height: 1.2;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

export const ModalBox = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  width: 85vw;
  max-width: 750px;      /* caps the width at 700px */
  max-height: 75vh;      /* caps height at 75% of viewport */
  overflow-y: auto;      /* scroll vertically if content is too tall */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  font-family: sans-serif;

  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #111827;
    text-align: center;
  }

  h4 {
    font-size: 1.1rem;
    margin: 1rem 0 0.5rem;
    text-align: left;
  }

  p {
    margin: 0.25rem 0;
  }

  ul {
    padding-left: 1rem;
    margin: 0.5rem 0;
  }

  li {
    margin-bottom: 0.25rem;
  }

  input[type="text"],
  input[type="date"],
  input[type="email"],
  input[type="number"] {
    width: 80%;
    padding: 0.75rem;
    font-size: 1rem;
    margin: 0.2rem 0;
    border: 1px solid #d1d5db;
    border-radius: 6px;
  }

  button {
    padding: 0.5rem 1rem;
    font-weight: 600;
    background: #0F5BA4;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;

    &:hover {
      background: #0c4784;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const PatrolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
`;

export const PatrolCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  background-color: #ffffff;

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #0f172a;
  }
`;
export const AdminInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

export const AdminInputField = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
`;

export const AdminInputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;
export const AdminInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 1rem;
  background-color: white;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #0F5BA4;
    box-shadow: 0 0 0 1px #0F5BA4;
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

export const CompactInputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

export const CompactInput = styled.input`
  width: 200px;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #ccc;
  border-radius: 6px;

  &:focus {
    outline: none;
    border-color: #0F5BA4;
    box-shadow: 0 0 0 1px #0F5BA4;
  }
`;
export const CompactSelect = styled.select`
  width: 200px;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: white;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #0F5BA4;
    box-shadow: 0 0 0 1px #0F5BA4;
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;
export const ButtonRowRight = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  margin-bottom: 2rem;
`;

export const StyledLogo = styled.img`
  width: 90%;
  max-width: 300px;
  height: auto;
  object-fit: contain;
`;

export const AdminTextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
  margin-bottom: 1rem;
  background-color: white;
  color: #111827;

  &:focus {
    outline: none;
    border-color: #0F5BA4;
    box-shadow: 0 0 0 1px #0F5BA4;
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  label {
    font-weight: bold;
  }

  select {
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;
export const Badge = styled.span`
  display: inline-block;
  background-color: #0F5BA4;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
`;

export const Select = styled.select`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  appearance: none;
  outline: none;
  &:focus {
    border-color: #0F5BA4;
    box-shadow: 0 0 0 2px rgba(15, 91, 164, 0.25);
  }
`;
export const StyledTable = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 1rem;

  th, td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #eee;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 600;
  }

  tbody tr:nth-child(odd) {
    background-color: #fafafa;
  }

  tbody tr:hover {
    background-color: #f0f8ff;
  }
`;