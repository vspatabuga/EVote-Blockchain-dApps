"use client";

import { Container, Navbar, Nav } from 'react-bootstrap';
import { useWeb3 } from '@/contexts/Web3Provider';

export default function MainLayout({ children }) {
  const { account } = useWeb3();

  return (
    <>
      {/* PERUBAHAN 1: Menggunakan className, bukan bg/variant */}
      <Navbar collapseOnSelect expand="lg" className="app-header-blur" sticky="top">
        <Container>
          <Navbar.Brand href="/" className="fw-bold">
            E-Voting dApp
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="ms-auto">
              {account ? (
                // PERUBAHAN 2: Tampilan akun sekarang memiliki border dan gaya khusus
                <div className="account-display">
                  <span>Terhubung: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</span>
                </div>
              ) : (
                <div className="account-display">
                  <span>Tidak Terhubung</span>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Konten utama sekarang memiliki padding yang konsisten */}
      <main>
        <Container className="py-4">
          {children}
        </Container>
      </main>
    </>
  );
}