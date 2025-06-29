"use client";

import { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';

export default function VoterPanel({ contract, sessionId }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (contract && sessionId) {
        setIsLoading(true);
        try {
          // Ambil daftar kandidat
          const session = await contract.daftarSesi(sessionId);
          const candidateCount = session.jumlahKandidat.toNumber();
          const candidatesList = [];
          for (let i = 1; i <= candidateCount; i++) {
            const candidate = await contract.daftarKandidat(sessionId, i);
            candidatesList.push({ id: candidate.id.toNumber(), name: candidate.nama, voteCount: candidate.jumlahSuara.toNumber() });
          }
          setCandidates(candidatesList);

          // Cek apakah user sudah pernah vote di sesi ini
          // Anda perlu menambahkan 'account' dari useWeb3() jika VoterPanel tidak menerimanya sebagai prop
          // Untuk sekarang, kita asumsikan pengecekan dilakukan saat voting
        } catch (err) {
          console.error("Gagal mengambil data: ", err);
          setError("Tidak dapat memuat data kandidat.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchInitialData();
  }, [contract, sessionId]);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      toast.error("Silakan pilih salah satu kandidat terlebih dahulu.");
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Mengirim suara Anda ke blockchain...');

    try {
      const tx = await contract.vote(sessionId, selectedCandidateId);
      await tx.wait();
      toast.success("Terima kasih! Suara Anda telah berhasil dicatat.", { id: toastId });
      setHasVoted(true); // Tandai bahwa user sudah berhasil vote
    } catch (err) {
      const reason = err.reason || "Transaksi ditolak atau gagal.";
      toast.error(`Gagal memberikan suara: ${reason}`, { id: toastId });
      setError(`Gagal memberikan suara: ${reason}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner animation="border" role="status"><span className="visually-hidden">Memuat...</span></Spinner>;
  }

  if (hasVoted) {
      return (
          <Alert variant="success">
              <Alert.Heading>Terima Kasih!</Alert.Heading>
              <p>Anda telah berhasil berpartisipasi dalam sesi pemilihan ini. Suara Anda telah diamankan di dalam blockchain.</p>
          </Alert>
      );
  }

  return (
    <Card>
      <Card.Header as="h3">Portal Pemilihan - Sesi {sessionId}</Card.Header>
      <Card.Body>
        <Card.Title>Silakan Pilih Kandidat Anda</Card.Title>
        <Form onSubmit={handleVote}>
          <ListGroup variant="flush" className="my-4">
            {candidates.map((candidate) => (
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
            ))}
          </ListGroup>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          
          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={isLoading || !selectedCandidateId}>
              {isLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Mengirim Suara...</span>
                </>
              ) : 'Kirim Suara'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}