"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider'; // Pastikan path ini benar
import { Card, Form, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function VoterPanel({ contract }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  
  // State untuk info sesi aktif
  const [sessionInfo, setSessionInfo] = useState(null);

  // Efek untuk mengambil info sesi dan kandidat
  const loadVoterData = useCallback(async () => {
    if (contract) {
      setIsLoading(true);
      setError('');
      try {
        // Ambil info sesi aktif dari API pusat
        const sessionRes = await fetch('/api/public/active-session-info');
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) throw new Error(sessionData.message);
        setSessionInfo(sessionData);

        if (sessionData.active) {
            // PERBAIKAN: Gunakan Number() untuk mengubah BigInt dari on-chain data
            const sessionOnChain = await contract.daftarSesi(sessionData.id);
            const candidateCount = Number(sessionOnChain.jumlahKandidat);
            
            const candidatesList = [];
            for (let i = 1; i <= candidateCount; i++) {
                const candidate = await contract.daftarKandidat(sessionData.id, i);
                candidatesList.push({ 
                    id: Number(candidate.id), 
                    name: candidate.nama,
                });
            }
            setCandidates(candidatesList);
        }
      } catch (err) {
        console.error("Gagal memuat data VoterPanel:", err);
        setError("Tidak dapat memuat data pemilihan.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [contract]);

  useEffect(() => {
    loadVoterData();
  }, [loadVoterData]);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      toast.error("Silakan pilih salah satu kandidat terlebih dahulu.");
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Mengirim suara Anda ke blockchain...');

    try {
      const tx = await contract.vote(sessionInfo.id, selectedCandidateId);
      await tx.wait(); // Tunggu transaksi dikonfirmasi
      toast.success("Terima kasih! Suara Anda telah berhasil dicatat.", { id: toastId });
      setHasVoted(true); // Tandai bahwa user sudah berhasil vote
    } catch (err) {
      const reason = err.reason || "Transaksi ditolak atau Anda sudah memilih.";
      toast.error(`Gagal memberikan suara: ${reason}`, { id: toastId });
      setError(`Gagal memberikan suara: ${reason}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner animation="border" role="status"><span className="visually-hidden">Memuat Portal Pemilihan...</span></Spinner>;
  }
  
  if (hasVoted) {
      return (
          <Alert variant="success">
              <Alert.Heading>Terima Kasih!</Alert.Heading>
              <p>Anda telah berhasil berpartisipasi dalam sesi pemilihan ini. Suara Anda telah diamankan di dalam blockchain.</p>
          </Alert>
      );
  }

  if (sessionInfo && sessionInfo.status !== 'VotingBerlangsung') {
      return (
          <Alert variant="warning">
            Periode voting untuk sesi <strong>"{sessionInfo.name}"</strong> saat ini <strong>{sessionInfo.status}</strong>.
          </Alert>
      );
  }

  return (
    <Card className="card-shadow">
      <Card.Header as="h3">Portal Pemilihan - {sessionInfo?.name || 'Sesi Tidak Ditemukan'}</Card.Header>
      <Card.Body>
        <Card.Title>Silakan Pilih Kandidat Anda</Card.Title>
        <Form onSubmit={handleVote}>
          <ListGroup variant="flush" className="my-4">
            {candidates.length > 0 ? candidates.map((candidate) => (
              <ListGroup.Item key={candidate.id}>
                <Form.Check 
                  type="radio"
                  id={`candidate-${candidate.id}`}
                  label={candidate.name}
                  name="candidate"
                  value={candidate.id}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                />
              </ListGroup.Item>
            )) : <p>Belum ada kandidat untuk sesi ini.</p>}
          </ListGroup>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          
          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={isLoading || !selectedCandidateId}>
              {isLoading ? 'Mengirim Suara...' : 'Kirim Suara'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}