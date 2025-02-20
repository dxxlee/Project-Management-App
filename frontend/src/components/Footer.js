import React from 'react';
import { Container } from 'react-bootstrap';
import styled from 'styled-components';

// Styled Footer component with custom styles
const StyledFooter = styled.footer`
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff !important;
  padding: 16px 0;
  margin-top: auto; 
  text-align: center;

  .footer-content {
    color: #42526e;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .footer-link {
    color: #0052cc !important;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      color: #003b95 !important;
      text-decoration: underline;
    }
  }
`;

const Footer = () => {
  return (
    <StyledFooter>
      <Container fluid="lg">
        <div className="footer-content">
          © 2025{' '}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Project Manager
          </a>
          . All rights reserved.
        </div>
      </Container>
    </StyledFooter>
  );
};

export default Footer;