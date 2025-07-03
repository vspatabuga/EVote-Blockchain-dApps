"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Spinner } from 'react-bootstrap';

import RegistrationForm from '@/components/RegistrationForm';
import OnboardingPage from '@/components/OnboardingPage';
import AnnouncementCard from '@/components/AnnouncementCard';
import { useWeb3 } from '@/contexts/Web3Provider';

export default function HomePage() {
  const router = useRouter();
  const { account, isLoading } = useWeb3();

  // State untuk alur pendaftaran
  const [appState, setAppState] = useState('register');
  const [validatedNim, setValidatedNim] = useState(null);
  

  // State untuk data pengumuman
  const [announcementData, setAnnouncementData] = useState(null);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(true);
  const [announcementError, setAnnouncementError] = useState('');

  // Efek untuk menerapkan tema gelap
  useEffect(() => {
    document.body.className = 'theme-dark';
  }, []);

  // Ambil data hasil pemilu terakhir saat halaman dimuat
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoadingAnnouncement(true);
      try {
        const response = await fetch('/api/public/latest-result');
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setAnnouncementData(data);
      } catch (err) {
        setAnnouncementError(err.message);
      } finally {
        setIsLoadingAnnouncement(false);
      }
    };
    fetchResults();
  }, []);
  
  // Efek untuk auto-redirect jika sudah login
  // useEffect(() => {
  //   // Jika provider tidak sedang loading DAN sebuah akun sudah terhubung,
  //   // artinya login berhasil, maka arahkan ke dashboard.
  //   if (!isLoading && account) {
  //     router.push('/dashboard');
  //   }
  // }, [isLoading, account, router]); // Awasi perubahan pada state ini

  const handleRegistrationSuccess = (nim) => {
    setValidatedNim(nim);
    setAppState('onboarding');
  };

  // Komponen yang ditampilkan di kolom kanan berdasarkan state
  const RightPanel = () => {
    if (appState === 'register') {
      return <RegistrationForm onSuccess={handleRegistrationSuccess} />;
    }
    if (appState === 'onboarding') {
      return <OnboardingPage nim={validatedNim} onSuccess={() => router.push('/dashboard')} />;
    }
    return <Spinner animation="border" />; // Fallback
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Container>
        <Row>
          {/* Kolom Kiri untuk Pengumuman */}
          <Col md={6} className="d-flex flex-column justify-content-center text-light mb-4 mb-md-0">
            <h1 className="mb-4">Portal E-Voting Terdesentralisasi</h1>
            <p className="lead">Platform pemungutan suara yang transparan, aman, dan dapat diaudit menggunakan teknologi blockchain.</p>
            <div className="mt-4">
              <AnnouncementCard 
                data={announcementData} 
                isLoading={isLoadingAnnouncement} 
                error={announcementError} 
              />
            </div>
          </Col>

          {/* Kolom Kanan untuk Aksi Pengguna */}
          <Col md={6}>
            <RightPanel />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}