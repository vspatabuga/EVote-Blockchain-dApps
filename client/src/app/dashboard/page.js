"use client";

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

import AdminPanel from '@/components/AdminPanel';
import VoterPanel from '@/components/VoterPanel';
import MainLayout from '@/components/MainLayout';
import { Container, Spinner } from 'react-bootstrap';

export default function DashboardPage() {
  const { account, provider, isLoading: isWeb3Loading } = useWeb3();
  const router = useRouter();
  
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      if (!account) {
        if (!isWeb3Loading) router.push('/');
        return;
      }
      if (provider) {
        try {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          const contractAddress = Election.networks[String(network.chainId)]?.address;

          if (contractAddress) {
            const electionContract = new ethers.Contract(contractAddress, Election.abi, signer);
            setContract(electionContract);
            const owner = await electionContract.owner();
            setIsAdmin(owner.toLowerCase() === account.toLowerCase());
          }
        } catch (error) {
          console.error("Gagal inisialisasi dashboard:", error);
        } finally {
          setIsLoadingPage(false);
        }
      }
    };
    initializePage();
  }, [account, provider, isWeb3Loading, router]);

  if (isWeb3Loading || isLoadingPage) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }
  
  const activeSessionId = 1;

  return (
    <MainLayout>
      <div className="mb-3">
        <h3>Selamat Datang di Portal E-Voting</h3>
      </div>
      {isAdmin ? (
        <AdminPanel contract={contract} />
      ) : (
        <VoterPanel contract={contract} sessionId={activeSessionId} />
      )}
    </MainLayout>
  );
}