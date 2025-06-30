import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

const statusMapping = ['Belum Dimulai', 'Registrasi', 'VotingBerlangsung', 'Selesai'];

export async function GET() {
    try {
        // Cari sesi yang ditandai sebagai aktif di database
        const activeSession = await db('sesi_pemilihan')
            .where({ is_active: true })
            .first();

        if (!activeSession) {
            return NextResponse.json({ 
                active: false, 
                message: 'Saat ini tidak ada sesi yang diaktifkan oleh admin.' 
            });
        }

        const sessionId = activeSession.id;

        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const contractAddress = Election.networks[String(1337)]?.address;
        if (!contractAddress) throw new Error("Alamat kontrak tidak ditemukan.");
        
        const contract = new ethers.Contract(contractAddress, Election.abi, provider);
        const sessionOnChain = await contract.daftarSesi(sessionId);

        // PERBAIKAN DI SINI: Gunakan nama variabel yang benar, yaitu 'activeSession'
        return NextResponse.json({
            active: true,
            id: sessionId,
            name: activeSession.nama_sesi, // Sebelumnya 'latestSession.nama_sesi'
            status: statusMapping[Number(sessionOnChain.status)],
        });

    } catch (error) {
        console.error("Get Active Session API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil data sesi aktif.' }, { status: 500 });
    }
}