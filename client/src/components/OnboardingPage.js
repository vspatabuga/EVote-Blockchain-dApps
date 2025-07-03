"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { Button, Card, ListGroup, Spinner, Alert, Badge, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

// Definisi detail Jaringan E-Vote Dev Network
// Ini adalah jaringan lokal yang digunakan untuk pengembangan
const E_VOTE_DEV_NETWORK = {
  chainId: '0x539', // 1337 dalam format hexadecimal
  chainName: 'E-Vote Dev Network',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://ganache.vspatabuga.io'], // Ganti dengan URL RPC Anda jika berbeda
};

// Helper untuk menerjemahkan status Enum dari Solidity ke Teks
const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export default function OnboardingPage({ nim, onSuccess }) {
  // Ambil semua state dan fungsi yang relevan dari provider
  // const { account, provider, contract, connectWallet, isLoading: isWeb3Connecting } = useWeb3();
  const { account, provider, connectWallet, isLoading: isWeb3Connecting } = useWeb3();
  const router = useRouter();

  // State khusus untuk halaman ini
  const [isNetworkCorrect, setIsNetworkCorrect] = useState(false);
  const [isFunded, setIsFunded] = useState(false);
  const [isRegistrationFinalized, setIsRegistrationFinalized] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);

  // Fungsi untuk memeriksa jaringan dan status sesi
  const checkPrerequisites = useCallback(async () => {
    if (provider && account && sessionInfo) { // Pastikan sessionInfo sudah ada
      try {
        // Cek Jaringan (logika ini tidak berubah)
        const network = await provider.getNetwork();
        const isCorrect = network.chainId === 1337n;
        setIsNetworkCorrect(isCorrect);

        // --- PENAMBAHAN LOGIKA BARU ---
        // Periksa status registrasi dari database
        const regCheckRes = await fetch('/api/check-registration', { // Asumsi kita buat API baru untuk ini
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nim, sesiId: sessionInfo.id })
        });
        const regData = await regCheckRes.json();
        if (regData.isRegistered) {
            setIsAlreadyRegistered(true);
            setIsRegistrationFinalized(true); // Langsung tandai final jika sudah terdaftar
            toast.info("Sistem mendeteksi Anda sudah terdaftar di sesi ini.");
        }
        // --- AKHIR PENAMBAHAN LOGIKA ---

        // --- PENAMBAHAN LOGIKA BARU ---
        // Setelah mendapatkan info sesi, cek apakah NIM ini sudah terdaftar di sesi tersebut
        if (sessionData.active) {
            const regCheckRes = await fetch('/api/check-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nim, sesiId: sessionData.id })
            });
            const regData = await regCheckRes.json();
            if (regData.isRegistered) {
                setIsRegistrationFinalized(true); // Langsung tandai final jika sudah terdaftar
                toast.info("Sistem mendeteksi Anda sudah terdaftar di sesi ini.");
            }
        }
        // --- AKHIR PENAMBAHAN LOGIKA ---

      } catch (err) {
        setError("Gagal memuat status jaringan atau registrasi.");
      }
    }
  }, [account, provider, sessionInfo, nim]);

  // useEffect 1: HANYA untuk memeriksa JARINGAN. Berjalan segera setelah provider siap.
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider && account) {
        try {
          const network = await provider.getNetwork();
          const isCorrect = network.chainId === 1337n;
          setIsNetworkCorrect(isCorrect);
          if (!isCorrect) {
            toast.error("Jaringan salah. Harap beralih ke 'E-Vote Dev Network' di MetaMask.");
          }
        } catch (err) {
          console.error("Gagal memeriksa jaringan:", err);
          setError("Gagal memuat status jaringan.");
        }
      }
    };
    checkNetwork();
  }, [account, provider]);

  // useEffect 2: HANYA untuk memeriksa SESI dan status REGISTRASI.
  useEffect(() => {
    const checkSessionAndRegistration = async () => {
      // Tidak perlu lagi memeriksa provider/account di sini karena kita tahu ini hanya berjalan jika ada perubahan
      try {
        const sessionRes = await fetch('/api/public/active-session-info');
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) throw new Error(sessionData.message);
        setSessionInfo(sessionData);

        if (sessionData.active && account && nim) {
          const regCheckRes = await fetch('/api/check-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nim, sesiId: sessionData.id })
          });
          const regData = await regCheckRes.json();
          if (regData.isRegistered) {
              setIsAlreadyRegistered(true);
              setIsRegistrationFinalized(true);
              // Tampilkan toast dengan ikon default atau ikon spesifik
              toast("Sistem mendeteksi Anda sudah terdaftar di sesi ini.", { icon: 'ℹ️' });
          }
        }
      } catch (err) {
        setError(prev => `${prev} Gagal memuat info sesi.`);
        console.error("Gagal memeriksa sesi:", err);
      }
    };
    checkSessionAndRegistration();
  }, [account, nim]); // Kita picu ini saat akun berubah

  // useEffect 3: HANYA untuk memeriksa OTORISASI ADMIN (tidak berubah)
// Efek untuk memeriksa status otorisasi dari admin
  useEffect(() => {
      // Hanya berjalan jika registrasi sudah final dan KONEKSI sudah siap
      if (isRegistrationFinalized && provider && account && sessionInfo?.id) {

          const checkAuthorization = async () => {
              try {
                  // Buat instance kontrak read-only di sini secara langsung
                  const contractAddress = Election.networks[String(1337)]?.address;
                  if (!contractAddress) {
                      console.error("Alamat kontrak tidak ditemukan untuk pengecekan otorisasi.");
                      return;
                  }
                  const readOnlyContract = new ethers.Contract(contractAddress, Election.abi, provider);

                  const authorized = await readOnlyContract.pemilihTerotorisasi(sessionInfo.id, account);
                  if (authorized) {
                      setIsAuthorized(true);
                      toast.success("Anda telah diotorisasi oleh admin!");
                      // Hentikan interval setelah ditemukan (dijelaskan di bawah)
                  }
              } catch (err) {
                  console.error("Gagal memeriksa status otorisasi:", err);
              }
          };

          // Lakukan pengecekan pertama kali segera
          checkAuthorization();

          // Atur pengecekan berkala
          const interval = setInterval(checkAuthorization, 5000); // Periksa setiap 5 detik

          // Hentikan interval jika sudah terotorisasi atau komponen di-unmount
          if (isAuthorized) {
              clearInterval(interval);
          }
          return () => clearInterval(interval);
      }
  }, [isRegistrationFinalized, provider, account, sessionInfo, isAuthorized]); // Tambahkan isAuthorized ke dependensi



  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  // Fungsi Mengecek jaringan
  const handleSwitchOrAddNetwork = async () => {
  if (!provider) {
    toast.error("Provider wallet tidak ditemukan.");
    return;
  }

  const toastId = toast.loading("Meminta untuk ganti jaringan...");
  try {
    // Mengirim permintaan ke MetaMask untuk menambah/beralih jaringan
    await provider.send('wallet_addEthereumChain', [E_VOTE_DEV_NETWORK]);
    toast.success("Jaringan berhasil diubah!", { id: toastId });
    // State isNetworkCorrect akan diperbarui secara otomatis oleh useEffect yang sudah ada
  } catch (error) {
    console.error("Gagal menambahkan atau mengganti jaringan:", error);
    toast.error("Gagal: Anda menolak permintaan atau terjadi error lain.", { id: toastId });
  }
};

  // Fungsi untuk meminta dana dari faucet
  const handleGetFunds = async () => {
    if (sessionInfo?.status !== 'Registrasi') {
      return toast.error(`Tidak bisa meminta dana. Status sesi saat ini: ${sessionInfo?.status || 'Tidak Diketahui'}`);
    }
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
      setIsFunded(true);
    } catch (err) {
      toast.error(`Gagal mendapatkan dana: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Fungsi untuk finalisasi registrasi
const handleFinalizeRegistration = async () => {
    setIsActionLoading(true);
    const toastId = toast.loading('Menyimpan data registrasi...');
    try {
      const response = await fetch('/api/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, walletAddress: account, sesiId: sessionInfo.id }),
      });
      const data = await response.json();

      // *** AWAL PERUBAHAN ***
      if (!response.ok) {
        // Jika respons bukan OK (misalnya 4xx atau 5xx)
        if (response.status === 409) { // Cek spesifik jika statusnya 409 Conflict
          toast.success('Anda sudah terdaftar di sesi ini!', { id: toastId }); // Tampilkan pesan bahwa sudah terdaftar (sebagai sukses/info)
          setIsRegistrationFinalized(true); // Tandai registrasi sebagai final karena sudah ada
          // Tambahkan setIsAlreadyRegistered(true); jika Anda menggunakan state ini di UI Anda
          // setIsAlreadyRegistered(true);
        } else {
          // Untuk error lain selain 409, lempar error asli
          throw new Error(data.message);
        }
      } else {
        // Jika respons OK (status 200), berarti registrasi berhasil disimpan untuk pertama kali
        toast.success('Registrasi Anda berhasil disimpan! Menunggu otorisasi admin.', { id: toastId });
        setIsRegistrationFinalized(true);
        // Tambahkan setIsAlreadyRegistered(true); jika Anda menggunakan state ini di UI Anda
        // setIsAlreadyRegistered(true);
      }
      // *** AKHIR PERUBAHAN ***

    } catch (err) {
      toast.error(`Finalisasi gagal: ${err.message}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
};

  // Fungsi untuk masuk ke portal voting
  const handleEnterVotingPortal = () => {
      if (isAuthorized) {
          toast.success("Mengarahkan ke portal voting...");
          router.push('/dashboard');
      } else {
          toast.error("Anda belum diotorisasi oleh admin untuk masuk.");
      }
  };

  const isLoading = isWeb3Connecting || isActionLoading;

  return (
    <Card className="card-shadow">
      <Card.Header as="h3">Halaman Orientasi Pemilih</Card.Header>
      <Card.Body>
        <Card.Text>Selamat datang, pemilih dengan NIM <strong>{nim}</strong>.</Card.Text>
        
        {sessionInfo ? (
            <Alert variant={sessionInfo.status === 'Registrasi' ? 'success' : 'warning'}>
                Sesi Aktif: <strong>{sessionInfo.name || "Tidak ada"}</strong> | Status: <strong>{sessionInfo.status || "Memuat..."}</strong>
            </Alert>
        ) : (<Alert variant="secondary">Memuat informasi sesi...</Alert>)}

        <ListGroup className="my-4">
          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>1. Hubungkan Wallet</strong></div>
            {!account ? <Button variant="primary" onClick={connectWallet} disabled={isLoading}>{isWeb3Connecting ? 'Menghubungkan...' : 'Hubungkan'}</Button> : <Badge bg="success">Selesai</Badge>}
          </ListGroup.Item>
          
        <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
          <div><strong>2. Berada di Jaringan Voting</strong></div>
          {!account ? (
              <Badge bg="secondary">Menunggu</Badge>
          ) : isNetworkCorrect ? (
              <Badge bg="success">✓ Benar</Badge>
          ) : (
              <Button variant="warning" size="sm" onClick={handleSwitchOrAddNetwork}>
                  Ganti/Tambah Jaringan
              </Button>
          )}
        </ListGroup.Item>
          
          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>3. Minta Dana Uji Coba</strong></div>
            <Button variant="secondary" onClick={handleGetFunds} disabled={!isNetworkCorrect || isFunded || isLoading || sessionInfo?.status !== 'Registrasi'}>
              {isActionLoading ? <Spinner size="sm"/> : (isFunded ? '✓ Dana Diterima' : 'Minta Dana')}
            </Button>
          </ListGroup.Item>

          <ListGroup.Item as="li" className="d-flex justify-content-between align-items-center">
            <div><strong>4. Finalisasi Registrasi</strong><br/><small>Simpan data Anda untuk diverifikasi admin.</small></div>
            
            {isRegistrationFinalized ? (
                <Badge bg="success">✓ Registrasi Selesai</Badge>
            ) : (
                <Button variant="primary" onClick={handleFinalizeRegistration} disabled={!isFunded || isLoading}>
                    Selesaikan Registrasi
                </Button>
            )}
          </ListGroup.Item>
        </ListGroup>

        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="d-grid mt-4">
          <Button 
              variant="success" 
              size="lg" 
              onClick={handleEnterVotingPortal} 
              disabled={!isAuthorized || isLoading}
          >
              Masuk ke Portal Voting
          </Button>
          {!isAuthorized && isRegistrationFinalized && <p className="text-muted text-center mt-2">Tombol masuk akan aktif setelah admin mengotorisasi Anda.</p>}
        </div>
      </Card.Body>
    </Card>
  );
}