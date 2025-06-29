"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { Button, Card, ListGroup, Spinner, Alert, Badge, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';

const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export default function OnboardingPage({ nim, onSuccess }) {
  const { account, provider, contract, connectWallet, isLoading: isWeb3Connecting } = useWeb3();

  // State untuk UI
  const [isNetworkCorrect, setIsNetworkCorrect] = useState(false);
  const [isFunded, setIsFunded] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');

  // State BARU untuk menyimpan info sesi aktif
  const [sessionInfo, setSessionInfo] = useState({ status: 'Memuat...', name: 'Memuat nama sesi...' });

  // Efek untuk memeriksa jaringan (tetap sama)
  const checkCurrentNetwork = useCallback(async () => {
    if (provider && account) {
      const network = await provider.getNetwork();
      setIsNetworkCorrect(network.chainId === 1337n);
    }
  }, [account, provider]);

  useEffect(() => {
    checkCurrentNetwork();
  }, [checkCurrentNetwork]);

  // Efek BARU untuk mengambil status sesi dari smart contract
  useEffect(() => {
    const fetchSessionStatus = async () => {
      // Hanya berjalan jika kontrak sudah siap
      if (contract) {
        try {
          const totalSesi = await contract.totalSesi();
          if (Number(totalSesi) > 0) {
            // Kita ambil data dari sesi terakhir yang dibuat
            const sesi = await contract.daftarSesi(Number(totalSesi));
            setSessionInfo({
              id: Number(totalSesi),
              status: statusMapping[Number(sesi.status)],
              name: sesi.nama
            });
          } else {
            setSessionInfo({ id: null, status: 'Tidak Ada Sesi', name: 'Belum ada sesi yang dibuat admin' });
          }
        } catch (err) {
          console.error("Gagal mengambil status sesi:", err);
          setError("Gagal mengambil status sesi dari blockchain.");
        }
      }
    };
    fetchSessionStatus();
  }, [contract]); // Bergantung pada 'contract'

  const handleGetFunds = async () => {
    // LOGIKA BARU: Periksa status sesi sebelum meminta dana
    if (sessionInfo.status !== 'Registrasi') {
      toast.error('Tidak ada sesi pemilihan yang sedang membuka pendaftaran untuk gas fee.');
      return;
    }

    setIsActionLoading(true);
    const toastId = toast.loading('Meminta dana dari faucet...');
    try {
      // Sisa logika sama seperti sebelumnya
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Dana berhasil dikirim!', { id: toastId });
      setIsFunded(true);
    } catch (err) {
      toast.error(`Gagal mendapatkan dana: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    // LOGIKA BARU: Periksa juga status sesi sebelum finalisasi
    if (sessionInfo.status !== 'Registrasi') {
        toast.error('Tidak bisa melanjutkan, sesi pendaftaran tidak dibuka.');
        return;
    }

    setIsActionLoading(true);
    const toastId = toast.loading('Menyelesaikan pendaftaran...');
    try {
      // Sisa logika sama seperti sebelumnya
      const response = await fetch('/api/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, walletAddress: account, sesiId: sessionInfo.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success('Pendaftaran Selesai! Mengarahkan ke dashboard...', { id: toastId });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(`Finalisasi gagal: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const isLoading = isWeb3Connecting || isActionLoading;

  return (
    <Container style={{ maxWidth: '600px' }} className="mt-5">
      <Card>
        <Card.Header as="h3">Halaman Orientasi (Onboarding)</Card.Header>
        <Card.Body>
          <Card.Text>Selamat datang, pemilih dengan NIM <strong>{nim}</strong>.</Card.Text>
          
          {/* Tampilan baru untuk status sesi */}
          <Alert variant="info">
            <Alert.Heading as="h6">Informasi Sesi Pemilihan</Alert.Heading>
            <p><strong>{sessionInfo.name}</strong> - Status: <strong>{sessionInfo.status}</strong></p>
          </Alert>

          <ListGroup className="my-4">
            {/* Langkah 1 dan 2 sama seperti sebelumnya */}
            <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
              <div><strong>1. Hubungkan Wallet</strong></div>
              {!account ? <Button variant="primary" onClick={connectWallet} disabled={isLoading}>Hubungkan</Button> : <Badge bg="success">Selesai</Badge>}
            </ListGroup.Item>
            <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
              <div><strong>2. Berada di Jaringan Voting</strong></div>
              {isNetworkCorrect ? <Badge bg="success">✓ Benar</Badge> : <Badge bg="warning">X Salah</Badge>}
            </ListGroup.Item>
            
            {/* Langkah 3 kini lebih cerdas */}
            <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
              <div><strong>3. Minta Dana Uji Coba</strong><br/><small>Hanya tersedia saat pendaftaran dibuka.</small></div>
              <Button variant="secondary" onClick={handleGetFunds} disabled={!isNetworkCorrect || isFunded || isLoading || sessionInfo.status !== 'Registrasi'}>
                {isActionLoading ? <Spinner size="sm" /> : (isFunded ? '✓ Sudah' : 'Minta Dana')}
              </Button>
            </ListGroup.Item>
          </ListGroup>
          
          <div className="d-grid">
            <Button variant="success" size="lg" onClick={handleFinalize} disabled={!isFunded || isLoading || sessionInfo.status !== 'Registrasi'}>
              Selesaikan & Masuk ke Portal Voting
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}