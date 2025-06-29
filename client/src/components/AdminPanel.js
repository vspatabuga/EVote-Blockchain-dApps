"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { Button, Form, Card, Spinner, Alert, ListGroup, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import toast from 'react-hot-toast';

const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export default function AdminPanel({ contract }) {
  const { account } = useWeb3();

  // State untuk data
  const [allSessions, setAllSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(''); // Dimulai kosong
  const [sessionStatus, setSessionStatus] = useState('Pilih Sesi...');
  const [candidates, setCandidates] = useState([]);
  const [registeredVoters, setRegisteredVoters] = useState([]);
  
  // State untuk form input
  const [newSessionName, setNewSessionName] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  
  // State untuk UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fungsi untuk mengambil daftar semua sesi saat komponen pertama kali dimuat
  const fetchAllSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/sessions');
      if (!response.ok) throw new Error('Gagal memuat sesi.');
      const data = await response.json();
      setAllSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  // Fungsi utama untuk mengambil semua data dari sesi yang dipilih
  const loadDataForSession = useCallback(async () => {
    if (!contract || !activeSessionId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const sessionData = await contract.daftarSesi(activeSessionId);
      setSessionStatus(statusMapping[Number(sessionData.status)]);

      const candidateCount = Number(sessionData.jumlahKandidat);
      const candidatesList = [];
      for (let i = 1; i <= candidateCount; i++) {
        const candidate = await contract.daftarKandidat(activeSessionId, i);
        candidatesList.push({ id: Number(candidate.id), name: candidate.nama });
      }
      setCandidates(candidatesList);

      const votersResponse = await fetch(`/api/admin/registered-voters?sessionId=${activeSessionId}`);
      if (!votersResponse.ok) throw new Error('Gagal mengambil data pendaftar.');
      const votersData = await votersResponse.json();
      setRegisteredVoters(votersData);

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [contract, activeSessionId]);

  useEffect(() => {
    // Hanya jalankan jika sesi aktif dipilih
    if (activeSessionId) {
      loadDataForSession();
    }
  }, [activeSessionId, loadDataForSession]);


  // Handler generik untuk memanggil API
  const handleApiCall = async (endpoint, body, loadingMessage, successMessage) => {
    const toastId = toast.loading(loadingMessage);
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, adminAddress: account })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(successMessage, { id: toastId });
      // Muat ulang data setelah aksi sukses
      if (endpoint === '/api/admin/create-session') {
        await fetchAllSessions(); // Jika membuat sesi baru, muat ulang daftar sesi
      } else {
        await loadDataForSession(); // Untuk aksi lain, muat ulang data sesi aktif
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: toastId });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    handleApiCall('/api/admin/create-session', { sessionName: newSessionName }, 'Membuat sesi baru...', 'Sesi baru berhasil dibuat!');
    setNewSessionName('');
  };
  
  const handleAddCandidate = (e) => {
    e.preventDefault();
    if (!newCandidateName) return;
    handleApiCall('/api/admin/add-candidate', { candidateName: newCandidateName, sessionId: activeSessionId }, 'Menambahkan kandidat...', 'Kandidat berhasil ditambahkan!');
    setNewCandidateName('');
  };

  const handleUpdateStatus = (newStatus) => {
    handleApiCall('/api/admin/update-session-status', { newStatus, sessionId: activeSessionId }, `Mengubah status menjadi ${newStatus}...`, 'Status sesi berhasil diperbarui!');
  };

  const handleAuthorizeVoters = () => {
    const walletAddresses = registeredVoters.map(v => v.wallet_address);
    if(walletAddresses.length === 0) return toast.error('Tidak ada pemilih untuk diotorisasi.');
    handleApiCall('/api/admin/authorize-voters', { walletAddresses, sessionId: activeSessionId }, 'Mengotorisasi pemilih...', 'Pemilih berhasil diotorisasi!');
  };

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  return (
    <div className="bg-light p-4 rounded">
      <h2>Panel Administator</h2>
      
      {/* MODUL MANAJEMEN SESI (BARU) */}
      <Card className="mb-4">
        <Card.Header as="h5">Manajemen Sesi</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} className="border-end">
              <h6>1. Buat Sesi Baru</h6>
              <Form onSubmit={handleCreateSession}>
                <Form.Group>
                  <Form.Control type="text" placeholder="Nama Sesi (cth: Pemilu BEM 2025)" value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} required />
                </Form.Group>
                <Button variant="dark" type="submit" className="mt-2 w-100" disabled={isLoading}>Buat Sesi</Button>
              </Form>
            </Col>
            <Col md={6}>
              <h6>2. Pilih Sesi untuk Dikelola</h6>
              <Form.Select 
                aria-label="Pilih Sesi" 
                value={activeSessionId} 
                onChange={(e) => setActiveSessionId(e.target.value)}
                disabled={isLoading}
              >
                <option value="">-- Pilih Sesi --</option>
                {allSessions.map(session => (
                  <option key={session.id} value={session.id}>
                    ID: {session.id} - {session.nama_sesi}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Semua modul lain hanya akan tampil jika sebuah sesi dipilih */}
      {activeSessionId && (
        <>
          <p className="text-muted">Detail untuk Sesi Pemilihan ID: <strong>{activeSessionId}</strong></p>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Card className="mb-4">
            <Card.Header as="h5">3. Kontrol Sesi Aktif</Card.Header>
            <Card.Body>
               <Card.Title>Status Saat Ini: <span className="fw-bold">{isLoading ? 'Memuat...' : sessionStatus}</span></Card.Title>
               <div className="d-flex flex-wrap gap-2 mt-3">
                    <Button variant="info" onClick={() => handleUpdateStatus('Registrasi')} disabled={isLoading || sessionStatus !== 'Belum Dimulai'}>Buka Pendaftaran</Button>
                    <Button variant="primary" onClick={() => handleUpdateStatus('VotingBerlangsung')} disabled={isLoading || sessionStatus !== 'Registrasi'}>Buka Voting</Button>
                    <Button variant="danger" onClick={() => handleUpdateStatus('Selesai')} disabled={isLoading || sessionStatus !== 'VotingBerlangsung'}>Tutup Voting</Button>
               </div>
            </Card.Body>
          </Card>

          <Row>
            <Col md={5} className="mb-3 mb-md-0">
              <Card>
                <Card.Header as="h5">4. Manajemen Kandidat</Card.Header>
                <Card.Body>
                  <ListGroup variant="flush" className="mb-3">
                    {candidates.length > 0 ? candidates.map(c => <ListGroup.Item key={c.id}>ID: {c.id} - {c.name}</ListGroup.Item>) : <ListGroup.Item>Belum ada kandidat.</ListGroup.Item>}
                  </ListGroup>
                  <Form onSubmit={handleAddCandidate}>
                     <Form.Group>
                        <Form.Control type="text" placeholder="Nama Kandidat Baru" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} required disabled={isLoading || sessionStatus !== 'Belum Dimulai'}/>
                     </Form.Group>
                     <Button variant="dark" type="submit" className="mt-2 w-100" disabled={isLoading || sessionStatus !== 'Belum Dimulai'}>Tambah Kandidat</Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7}>
              <Card>
                <Card.Header as="h5">5. Otorisasi Pemilih</Card.Header>
                <Card.Body>
                  <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '15px'}}>
                    <Table striped bordered hover size="sm">
                      <thead><tr><th>NIM</th><th>Alamat Wallet</th></tr></thead>
                      <tbody>
                        {registeredVoters.map(v => <tr key={v.registrasi_id}><td>{v.nim}</td><td className="text-monospace small">{v.wallet_address}</td></tr>)}
                      </tbody>
                    </Table>
                    {registeredVoters.length === 0 && !isLoading && <p className="text-muted text-center">Belum ada pemilih yang mendaftar.</p>}
                  </div>
                  <Button variant="success" className="w-100" onClick={handleAuthorizeVoters} disabled={isLoading || registeredVoters.length === 0 || sessionStatus !== 'Registrasi'}>Otorisasi {registeredVoters.length} Pemilih</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
           <Card className="mt-4 border-success">
          <Card.Header as="h5" className="bg-success text-white">Hasil Akhir Pemilihan</Card.Header>
          <Card.Body>
            <Card.Title>Total Suara Masuk: {totalVotes}</Card.Title>
            <ListGroup variant="flush" className="mt-3">
              {[...candidates].sort((a, b) => b.voteCount - a.voteCount).map(c => {
                  const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0;
                  return (
                    <ListGroup.Item key={c.id}>
                      <div className="d-flex justify-content-between fw-bold">
                        <span>{c.name}</span>
                        <span>{c.voteCount} Suara ({percentage}%)</span>
                      </div>
                      <ProgressBar now={percentage} label={`${percentage}%`} className="mt-2" />
                    </ListGroup.Item>
                  )
              })}
            </ListGroup>
          </Card.Body>
        </Card>
        </>
      )}
    </div>
  );
}