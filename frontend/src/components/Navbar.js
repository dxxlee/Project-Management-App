import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Navbar as BootstrapNavbar,
  Nav,
  Container,
} from 'react-bootstrap';
import styled from 'styled-components';

// Styled Navbar component with custom styles
const StyledNavbar = styled(BootstrapNavbar)`
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  background-color: #fff !important;
  padding: 8px 0;

  .navbar-brand {
    font-weight: 600;
    color: #0052cc !important;
    font-size: 1.25rem;
    margin-right: 2rem;
    padding: 8px 12px;

    &:hover {
      background-color: #f4f5f7;
      border-radius: 3px;
    }
  }

  .nav-link {
    color: #42526e !important;
    font-weight: 500;
    padding: 8px 12px !important;
    margin: 0 4px;
    border-radius: 3px;
    transition: all 0.2s;

    &:hover {
      color: #0052cc !important;
      background-color: #f4f5f7;
    }

    &.active {
      color: #0052cc !important;
      background-color: #f4f5f7;
    }
  }

  .navbar-toggler {
    border-color: transparent;

    &:focus {
      box-shadow: none;
    }
  }
`;

const Navbar = () => {
  const location = useLocation();

  return (
    <StyledNavbar expand="lg">
      <Container fluid="lg">
        {/* Navbar Brand */}
        <BootstrapNavbar.Brand as={Link} to="/">
          <span role="img" aria-label="rocket">🚀</span> Project Manager
        </BootstrapNavbar.Brand>

        {/* Navbar Toggle Button */}
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navbar Links */}
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link
              as={Link}
              to="/dashboard"
              className={location.pathname === '/dashboard' ? 'active' : ''}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/projects"
              className={location.pathname === '/projects' ? 'active' : ''}
            >
              Projects
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/tasks"
              className={location.pathname === '/tasks' ? 'active' : ''}
            >
              Tasks
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/teams"
              className={location.pathname === '/teams' ? 'active' : ''}
            >
              Teams
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </StyledNavbar>
  );
};

export default Navbar;