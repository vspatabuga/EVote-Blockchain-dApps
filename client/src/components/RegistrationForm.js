"use client";

import { useState } from 'react';
import { Form, Button, Card, Alert, Spinner, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useWeb3 } from '@/contexts/Web3Provider';

export default function RegistrationForm({ onSuccess }) {
  const { connectWallet } = useWeb3();
  const [nim, setNim] = useState('');
  const [pic, setPic] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVoterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Memvalidasi data...');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, pic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan');
      toast.success('Validasi NIM/PIC berhasil!', { id: loadingToast });
      onSuccess(nim);
    } catch (err) {
      toast.error(`Gagal: ${err.message}`, { id: loadingToast });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container style={{ maxWidth: '500px' }} className="mt-5">
      <Card>
        <Card.Header as="h3">Portal E-Voting</Card.Header>
        <Card.Body>
          <Card.Title>Registrasi Pemilih</Card.Title>
          <Card.Text>Untuk pemilih, silakan masukkan NIM dan PIN Anda.</Card.Text>
          <Form onSubmit={handleVoterSubmit}>
            <Form.Group className="mb-3" controlId="formNim">
              <Form.Label>NIM</Form.Label>
              <Form.Control type="text" placeholder="Masukkan NIM Anda" value={nim} onChange={(e) => setNim(e.target.value)} required disabled={isLoading}/>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPic">
              <Form.Label>PIN (PIC)</Form.Label>
              <Form.Control type="password" placeholder="Masukkan PIN Anda" value={pic} onChange={(e) => setPic(e.target.value)} required disabled={isLoading}/>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={isLoading}>{isLoading ? <Spinner size="sm" /> : 'Validasi'}</Button>
            </div>
          </Form>
          <hr className="my-4" />
          <Card.Title>Login</Card.Title>
          <Card.Text>Untuk Admin atau pemilih yang sudah mendaftar.</Card.Text>
          <div className="d-grid">
            <Button variant="secondary" onClick={connectWallet} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Hubungkan Wallet (Login)'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}