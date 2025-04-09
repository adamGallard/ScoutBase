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
  width: 16rem;
  height: 16rem;
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
    color: #1d4ed8;
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
