import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

// --- PERBAIKAN DIMULAI DI SINI ---
// Secara manual dan eksplisit memuat file .env.local dari root direktori 'client'
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// --- AKHIR PERBAIKAN ---

const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export async function GET() {
    try {
        const lastFinishedSession = await db('sesi_pemilihan')
            .where({ status: 'Selesai' })
            .orderBy('id', 'desc')
            .first();

        if (!lastFinishedSession) {
            return NextResponse.json({ active: false, message: 'Saat ini tidak ada hasil pemilu yang bisa ditampilkan.' });
        }

        const sessionId = lastFinishedSession.id;

        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contractAddress = Election.networks[String(1337)]?.address;
        if (!contractAddress) throw new Error("Alamat kontrak tidak ditemukan.");
        
        const contract = new ethers.Contract(contractAddress, Election.abi, provider);
        const sessionOnChain = await contract.daftarSesi(sessionId);
        
        const candidateCount = Number(sessionOnChain.jumlahKandidat);
        const candidates = [];
        for (let i = 1; i <= candidateCount; i++) {
            const candidate = await contract.daftarKandidat(sessionId, i);
            candidates.push({
                name: candidate.nama,
                voteCount: Number(candidate.jumlahSuara)
            });
        }

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