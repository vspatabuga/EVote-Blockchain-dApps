"use client";

import { Card, ProgressBar, Spinner, Alert } from 'react-bootstrap';

export default function AnnouncementCard({ data, isLoading, error }) {
  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="warning">{error}</Alert>;
  }

  const totalVotes = data?.candidates?.reduce((sum, c) => sum + c.voteCount, 0) || 0;

  return (
    <Card className="h-100">
      <Card.Header as="h4">Pengumuman</Card.Header>
      <Card.Body>
        {data && data.status === 'Selesai' ? (
          <>
            <Card.Title>Hasil Akhir: {data.sessionName}</Card.Title>
            <Card.Text>Total Suara Masuk: {totalVotes}</Card.Text>
            <div className="mt-4">
              {data.candidates.sort((a,b) => b.voteCount - a.voteCount).map((c, index) => {
                const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0;
                return(
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <strong>{c.name}</strong>
                      <span>{c.voteCount} suara</span>
                    </div>
                    <ProgressBar now={percentage} label={`${percentage}%`} />
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p>{data?.message || 'Selamat datang di Portal E-Voting. Belum ada hasil pemilu terbaru untuk ditampilkan.'}</p>
        )}
      </Card.Body>
    </Card>
  );
}