"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Card, Alert, Spinner, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useWeb3 } from '@/contexts/Web3Provider';

export default function RegistrationForm({ onSuccess }) {
  const { connectWallet, isLoading: isConnecting } = useWeb3();
  const router = useRouter();
  
  const [nim, setNim] = useState('');
  const [pic, setPic] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler HANYA untuk registrasi pemilih baru
  const handleVoterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const loadingToast = toast.loading('Memvalidasi NIM/PIC...');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, pic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Terjadi kesalahan');
      
      toast.success('Validasi berhasil! Lanjutkan ke orientasi.', { id: loadingToast });
      onSuccess(nim); // Panggil callback untuk pindah ke halaman Onboarding

    } catch (err) {
      toast.error(`Gagal: ${err.message}`, { id: loadingToast });
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler HANYA untuk login langsung
  const handleLogin = async () => {
    const success = await connectWallet();
    if (success) {
      router.push('/dashboard');
    }
    // Notifikasi error sudah ditangani di dalam connectWallet
  };

  const isLoading = isConnecting || isSubmitting;

  return (
    <Card>
      <Card.Header as="h3">Portal E-Voting</Card.Header>
      <Card.Body>
        <div className="mb-4">
          <Card.Title>1. Untuk Pemilih (Baru & Lama)</Card.Title>
          <Card.Text>Mulai dari sini untuk memvalidasi NIM & PIN Anda.</Card.Text>
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
              <Button variant="primary" type="submit" disabled={isLoading}>{isSubmitting ? 'Memvalidasi...' : 'Lanjutkan'}</Button>
            </div>
          </Form>
        </div>
        <hr/>
        <div className="mt-4">
          <Card.Title>2. Untuk Administrator</Card.Title>
          <Card.Text>Login langsung menggunakan wallet admin Anda.</Card.Text>
          <div className="d-grid">
            <Button variant="secondary" onClick={handleLogin} disabled={isLoading}>
              {isConnecting ? 'Menghubungkan...' : 'Login dengan Wallet Admin'}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}