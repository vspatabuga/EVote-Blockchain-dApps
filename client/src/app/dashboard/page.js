"use client";

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

import AdminPanel from '@/components/AdminPanel';
import VoterPanel from '@/components/VoterPanel';
import MainLayout from '@/components/MainLayout';
import { Container, Spinner, Alert } from 'react-bootstrap';

export default function DashboardPage() {
  const { account, provider, isLoading: isWeb3Loading } = useWeb3();
  const router = useRouter();
  
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      // Jika proses loading provider selesai dan ternyata tidak ada akun,
      // tendang kembali pengguna ke halaman utama.
      if (!isWeb3Loading && !account) {
        router.push('/');
        return;
      }

      // Hanya lanjutkan jika provider dan akun sudah siap.
      if (provider && account) {
        setIsLoadingPage(true);
        try {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          const contractAddress = Election.networks[String(network.chainId)]?.address;

          if (contractAddress) {
            const electionContract = new ethers.Contract(contractAddress, Election.abi, signer);
            setContract(electionContract);
            
            const owner = await electionContract.owner();
            setIsAdmin(owner.toLowerCase() === account.toLowerCase());
          } else {
            setPageError("Kontrak E-Voting tidak ditemukan di jaringan ini. Pastikan MetaMask terhubung ke jaringan yang benar.");
          }
        } catch (error) {
          console.error("Gagal inisialisasi dashboard:", error);
          setPageError("Gagal memuat data dari blockchain.");
        } finally {
          setIsLoadingPage(false); // Selesaikan loading halaman setelah semua pengecekan selesai
        }
      }
    };

    initializePage();
  }, [account, provider, isWeb3Loading, router]);

  // Tampilkan spinner jika provider ATAU halaman ini sedang dalam proses loading.
  if (isWeb3Loading || isLoadingPage) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Memuat Data Pengguna...</span>
        </Spinner>
      </Container>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-3">
        <h3>Selamat Datang di Portal E-Voting</h3>
      </div>

      {pageError && <Alert variant="danger">{pageError}</Alert>}

      {!pageError && (
        isAdmin ? (
          <AdminPanel contract={contract} />
        ) : (
          <VoterPanel contract={contract} />
        )
      )}
    </MainLayout>
  );
}