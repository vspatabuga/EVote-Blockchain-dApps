"use client";

import { Container, Navbar, Nav } from 'react-bootstrap';
import { useWeb3 } from '../contexts/Web3Provider';

export default function MainLayout({ children }) {
  const { account } = useWeb3();

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="/dashboard">E-Voting dApp</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {account ? (
                <Nav.Link disabled>
                  Terhubung: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </Nav.Link>
              ) : (
                <Nav.Link disabled>Tidak Terhubung</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        {children}
      </Container>
    </>
  );
}