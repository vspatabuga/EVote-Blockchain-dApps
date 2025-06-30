"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { Button, Card, ListGroup, Spinner, Alert, Badge, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function OnboardingPage({ nim }) {
  const { account, provider, connectWallet, isLoading: isWeb3Connecting } = useWeb3();
  const router = useRouter();

  // State untuk melacak penyelesaian setiap langkah
  const [isNetworkCorrect, setIsNetworkCorrect] = useState(false);
  const [isFunded, setIsFunded] = useState(false);
  
  // State untuk UI
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State untuk info sesi
  const [sessionInfo, setSessionInfo] = useState(null);

  // Efek untuk memeriksa jaringan dan status sesi secara bersamaan
  const checkPrerequisites = useCallback(async () => {
    if (provider && account) {
      try {
        // Cek Jaringan
        const network = await provider.getNetwork();
        const isCorrect = network.chainId === 1337n;
        setIsNetworkCorrect(isCorrect);
        if (!isCorrect) {
          toast.error("Jaringan salah. Harap beralih ke 'E-Vote Dev Network' di MetaMask.", { duration: 4000 });
        }
        
        // Cek Sesi Aktif dari API
        const sessionRes = await fetch('/api/public/active-session-info');
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) throw new Error(sessionData.message);
        setSessionInfo(sessionData);

        // Beri tahu user jika pendaftaran tidak dibuka
        if (sessionData.active && sessionData.status !== 'Registrasi') {
          toast.error(`Pendaftaran tidak dibuka (Status Sesi: ${sessionData.status}).`, { duration: 5000 });
        }

      } catch (err) {
        setError("Gagal memuat status jaringan atau sesi.");
        console.error("Gagal memeriksa prasyarat:", err);
      }
    }
  }, [account, provider]);

  useEffect(() => {
    // Jalankan pengecekan setiap kali akun atau provider berubah
    checkPrerequisites();
  }, [checkPrerequisites]);


  const handleGetFunds = async () => {
    setIsActionLoading(true);
    const toastId = toast.loading('Meminta dana dari faucet...');
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Dana berhasil dikirim!', { id: toastId });
      setIsFunded(true); // Tandai sudah mendapatkan dana
    } catch (err) {
      toast.error(`Gagal mendapatkan dana: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Fungsi final yang memanggil API link-wallet
  const handleFinalize = async () => {
    setIsActionLoading(true);
    const toastId = toast.loading('Menyelesaikan pendaftaran...');
    try {
      const response = await fetch('/api/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, walletAddress: account, sesiId: sessionInfo.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Pendaftaran Selesai! Mengarahkan ke dashboard...', { id: toastId });
      router.push('/dashboard'); // Arahkan ke dashboard HANYA setelah sukses
    } catch (err) {
      toast.error(`Finalisasi gagal: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const isLoading = isWeb3Connecting || isActionLoading;

  return (
    <Card>
      <Card.Header as="h3">Halaman Orientasi</Card.Header>
      <Card.Body>
        <Card.Text>Selamat datang, pemilih dengan NIM <strong>{nim}</strong>. Selesaikan semua langkah untuk dapat memilih.</Card.Text>
        
        {sessionInfo && (
            <Alert variant={sessionInfo.status === 'Registrasi' ? 'success' : 'warning'}>
                Sesi Aktif: <strong>{sessionInfo.name || "Tidak ada"}</strong> | Status: <strong>{sessionInfo.status || "Memuat..."}</strong>
            </Alert>
        )}

        <ListGroup className="my-4">
          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>1. Hubungkan Wallet</strong></div>
            {!account ? <Button onClick={connectWallet} disabled={isLoading}>{isWeb3Connecting ? <Spinner size="sm"/> : 'Hubungkan'}</Button> : <Badge bg="success">Selesai</Badge>}
          </ListGroup.Item>
          
          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>2. Berada di Jaringan Voting</strong></div>
            {!account ? <Badge bg="secondary">Menunggu</Badge> : isNetworkCorrect ? <Badge bg="success">✓ Benar</Badge> : <Badge bg="warning">X Salah</Badge>}
          </ListGroup.Item>
          
          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>3. Minta Dana Uji Coba</strong></div>
            <Button variant="secondary" onClick={handleGetFunds} disabled={!isNetworkCorrect || isFunded || isLoading || sessionInfo?.status !== 'Registrasi'}>
              {isActionLoading ? <Spinner size="sm"/> : (isFunded ? '✓ Sudah' : 'Minta Dana')}
            </Button>
          </ListGroup.Item>
        </ListGroup>

        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="d-grid">
          <Button variant="success" size="lg" onClick={handleFinalize} disabled={!isFunded || isLoading || sessionInfo?.status !== 'Registrasi'}>
            Selesaikan & Masuk ke Portal Voting
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}