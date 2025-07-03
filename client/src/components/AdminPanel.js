"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '@/contexts/Web3Provider';
import { Button, Form, Card, Spinner, Alert, ListGroup, Row, Col, Table, ProgressBar, Badge, Container } from 'react-bootstrap';
import toast from 'react-hot-toast';

const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export default function AdminPanel({ contract }) {
  const { account } = useWeb3();

  // State Management yang sudah disatukan dan benar [cite: 46, 4]
  const [allSessions, setAllSessions] = useState([]); 
  const [activeSession, setActiveSession] = useState(null); 
  const [candidates, setCandidates] = useState([]); 
  const [registeredVoters, setRegisteredVoters] = useState([]); 
  const [newSessionName, setNewSessionName] = useState(''); 
  const [newCandidateName, setNewCandidateName] = useState(''); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(''); 

  // PERBAIKAN: Nama fungsi diubah menjadi 'loadPanelData' agar konsisten 
  const loadPanelData = useCallback(async () => {
    if (!contract) return;
    setIsLoading(true); 
    setError(''); 
    try {
      // Mengambil semua sesi dari API terlebih dahulu 
      const allSessionsRes = await fetch('/api/admin/sessions'); 
      if (!allSessionsRes.ok) throw new Error('Gagal memuat daftar sesi.'); 
      const allSessionsData = await allSessionsRes.json(); 
      setAllSessions(allSessionsData); 

      // Mencari sesi yang aktif dari daftar semua sesi 
      const currentActive = allSessionsData.find(s => s.is_active); 
      
      if (currentActive) { 
        const activeSessionId = currentActive.id; 
        // Mengambil data sesi on-chain [cite: 8]
        const sessionOnChain = await contract.daftarSesi(activeSessionId); 
        const onChainStatus = statusMapping[Number(sessionOnChain.status)]; 
        
        // Menggunakan setActiveSession dan menyatukan data [cite: 8]
        setActiveSession({ ...currentActive, status: onChainStatus }); 

        // Mengambil data kandidat [cite: 9]
        const candidateCount = Number(sessionOnChain.jumlahKandidat); 
        const candidatesList = []; 
        for (let i = 1; i <= candidateCount; i++) {
          const c = await contract.daftarKandidat(activeSessionId, i); 
          candidatesList.push({ id: Number(c.id), name: c.nama, voteCount: Number(c.jumlahSuara) }); 
        }
        setCandidates(candidatesList); 

        // Mengambil data pemilih terdaftar [cite: 11]
        const votersRes = await fetch(`/api/admin/registered-voters?sessionId=${activeSessionId}`); 
        const votersData = await votersRes.json(); 
        setRegisteredVoters(votersData); 
      } else {
        setActiveSession(null); 
        setCandidates([]); 
        setRegisteredVoters([]); 
      }
    } catch (err) {
      setError('Gagal memuat data panel admin: ' + err.message); 
    } finally {
      setIsLoading(false); 
    }
  }, [contract]);

  useEffect(() => {
    if (contract) {
      loadPanelData(); // Memanggil nama fungsi yang benar [cite: 15]
    }
  }, [contract, loadPanelData]);

  // Handler API yang sudah benar [cite: 57]
  const handleApiCall = async (method, endpoint, body = {}) => {
    try {
      const toastId = toast.loading('Memproses permintaan...'); 
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });
      const data = await res.json(); 
      if (!res.ok) throw new Error(data.message); 
      toast.success(data.message || 'Aksi berhasil!', { id: toastId }); 
      await loadPanelData(); // Memanggil fungsi yang benar untuk refresh [cite: 19]
    } catch (err) {
      toast.error(`Error: ${err.message}`); 
      setError(err.message); // Menambahkan error state update
    }
  };

  const handleCreateSession = (e) => { e.preventDefault(); handleApiCall('POST', '/api/admin/sessions', { sessionName: newSessionName }); setNewSessionName(''); }; 
  const handleActivateSession = (sessionId) => handleApiCall('PUT', `/api/admin/sessions/${sessionId}`); 
  const handleDeleteSession = (sessionId) => { if (window.confirm(`Yakin ingin menghapus Sesi ID: ${sessionId}?`)) { handleApiCall('DELETE', `/api/admin/sessions/${sessionId}`); }}; 
  const handleUpdateStatus = (newStatus) => handleApiCall('POST', `/api/admin/update-session-status`, { newStatus, sessionId: activeSession.id }); 
  const handleAddCandidate = (e) => { e.preventDefault(); 
    if (!newCandidateName) return; handleApiCall('POST', '/api/admin/add-candidate', { candidateName: newCandidateName, sessionId: activeSession.id }); setNewCandidateName(''); }; 
  const handleAuthorizeVoters = () => { const walletAddresses = registeredVoters.map(v => v.wallet_address); 
    if (walletAddresses.length === 0) return toast.error('Tidak ada pemilih untuk diotorisasi.'); handleApiCall('POST', '/api/admin/authorize-voters', { walletAddresses, sessionId: activeSession.id }); }; 

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0); 
  
  if (isLoading) return <Container className="d-flex justify-content-center align-items-center p-5"><Spinner animation="border" /></Container>; 

  return (
    <Container className="bg-light p-4 rounded"> {/* Modul Container tetap ada sesuai V6 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
      <h2>Panel Administator</h2>
      <Button 
        variant="outline-primary" 
        onClick={loadPanelData} 
        disabled={isLoading}
        size="sm"
      >
        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : '🔄 Refresh Data'}
      </Button>
    </div>
      <h2>Manajemen Sesi Pemilihan</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card className="card-shadow">
        <Card.Header as="h5">Daftar Semua Sesi</Card.Header>
        <Table striped bordered hover responsive>
          <thead><tr><th>ID</th><th>Nama Sesi</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {allSessions.map(s => (
              <tr key={s.id} className={s.is_active ? 'table-success' : ''}> 
                <td>{s.id}</td><td>{s.nama_sesi}</td> 
                <td><Badge bg={s.is_active ? "success" : "secondary"}>{s.is_active ? "Aktif" : "Nonaktif"}</Badge></td> 
                <td className="d-flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleActivateSession(s.id)} disabled={s.is_active}>Aktifkan</Button> 
                  <Button variant="danger" size="sm" onClick={() => handleDeleteSession(s.id)}>Hapus</Button> 
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Card.Footer>
          <Form onSubmit={handleCreateSession}>
            <Row>
              <Col xs={8}>
                <Form.Control type="text" placeholder="Nama Sesi Baru" value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)} required /> 
              </Col>
              <Col xs={4}>
                <Button variant="dark" type="submit" className="w-100">Tambah Sesi</Button> 
              </Col>
            </Row>
          </Form>
        </Card.Footer>
      </Card>

      {activeSession ? ( 
        <div className="mt-5">
          <hr />
          <h3>Detail Sesi Aktif: <span className="text-primary">{activeSession.nama_sesi}</span> (ID: {activeSession.id})</h3> 
          <Card className="card-shadow">
            <Card.Header>Kontrol Sesi</Card.Header>
            <Card.Body>
              <Card.Title>Status Saat Ini: <span className="fw-bold">{activeSession.status}</span></Card.Title> 
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Button variant="info" onClick={() => handleUpdateStatus('Registrasi')} disabled={activeSession.status !== 'Belum Dimulai'}>Buka Pendaftaran</Button> 
                <Button variant="primary" onClick={() => handleUpdateStatus('VotingBerlangsung')} disabled={activeSession.status !== 'Registrasi'}>Buka Voting</Button> 
                <Button variant="danger" onClick={() => handleUpdateStatus('Selesai')} disabled={activeSession.status !== 'VotingBerlangsung'}>Tutup Voting</Button> 
              </div>
            </Card.Body>
          </Card>
          
          {activeSession.status !== 'Selesai' ? ( 
            <Row>
              <Col md={5} className="mb-3 mb-md-0">
                <Card className="card-shadow">
                  <Card.Header>Manajemen Kandidat</Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush" className="mb-3">
                      {candidates.length > 0 ? candidates.map(c => <ListGroup.Item key={c.id}>ID: {c.id} - {c.name}</ListGroup.Item>) : <ListGroup.Item>Belum ada kandidat.</ListGroup.Item>} 
                    </ListGroup>
                    <Form onSubmit={handleAddCandidate}>
                      <Form.Group>
                        <Form.Control type="text" placeholder="Nama Kandidat Baru" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} required disabled={activeSession.status !== 'Belum Dimulai'}/> 
                      </Form.Group>
                      <Button variant="dark" type="submit" className="mt-2 w-100" disabled={activeSession.status !== 'Belum Dimulai'}>Tambah Kandidat</Button> 
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={7}>
                <Card className="card-shadow">
                  <Card.Header>Otorisasi Pemilih</Card.Header>
                  <Card.Body>
                    <div style={{maxHeight: '200px', overflowY: 'auto', marginBottom: '15px'}}>
                      <Table striped bordered hover size="sm">
                        <thead><tr><th>NIM</th><th>Alamat Wallet</th></tr></thead>
                        <tbody>
                          {registeredVoters.map(v => <tr key={v.registrasi_id}><td>{v.nim}</td><td className="text-monospace small">{v.wallet_address}</td></tr>)} 
                        </tbody>
                      </Table>
                      {registeredVoters.length === 0 && <p className="text-muted text-center">Belum ada pemilih mendaftar.</p>} 
                    </div>
                    <Button variant="success" className="w-100" onClick={handleAuthorizeVoters} disabled={registeredVoters.length === 0 || activeSession.status !== 'Registrasi'}>Otorisasi {registeredVoters.length} Pemilih</Button> 
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <Card className="card-shadow">
              <Card.Header as="h5" className="bg-success text-white">Hasil Akhir Pemilihan</Card.Header> 
              <Card.Body>
                <Card.Title>Total Suara Masuk: {totalVotes}</Card.Title> 
                <ListGroup variant="flush" className="mt-3">
                  {[...candidates].sort((a, b) => b.voteCount - a.voteCount).map(c => {
                      const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0; 
                      return (
                        <ListGroup.Item key={c.id}>
                          <div className="d-flex justify-content-between fw-bold"><span>{c.name}</span><span>{c.voteCount} Suara ({percentage}%)</span></div> 
                          <ProgressBar now={percentage} label={`${percentage}%`} className="mt-2" /> 
                        </ListGroup.Item>
                      )
                  })}
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </div>
      ) : (
        <Alert variant="info" className="mt-4">
          Tidak ada sesi yang sedang aktif. Silakan aktifkan salah satu dari daftar di atas. 
        </Alert>
      )}
    </Container>
  );
}