import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

export async function GET() {
    try {
        // 1. Cari sesi terakhir yang statusnya 'Selesai' di database
        const lastFinishedSession = await db('sesi_pemilihan')
            .where({ status: 'Selesai' })
            .orderBy('id', 'desc')
            .first();

        if (!lastFinishedSession) {
            return NextResponse.json({ message: 'Saat ini tidak ada hasil pemilu yang bisa ditampilkan.' });
        }

        const sessionId = lastFinishedSession.id;

        // 2. Hubungkan ke blockchain untuk mengambil data on-chain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contractAddress = Election.networks[String(1337)]?.address;
        if (!contractAddress) throw new Error("Alamat kontrak tidak ditemukan.");
        
        const contract = new ethers.Contract(contractAddress, Election.abi, provider);

        // 3. Ambil data kandidat dan jumlah suaranya untuk sesi tersebut
        const sessionData = await contract.daftarSesi(sessionId);
        const candidateCount = Number(sessionData.jumlahKandidat);
        const candidates = [];
        for (let i = 1; i <= candidateCount; i++) {
            const candidate = await contract.daftarKandidat(sessionId, i);
            candidates.push({
                name: candidate.nama,
                voteCount: Number(candidate.jumlahSuara)
            });
        }

        // 4. Kirim data lengkap sebagai respons
        return NextResponse.json({
            sessionName: lastFinishedSession.nama_sesi,
            status: lastFinishedSession.status,
            candidates: candidates,
        });

    } catch (error) {
        console.error("Get Latest Result API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil data hasil terbaru.' }, { status: 500 });
    }
}