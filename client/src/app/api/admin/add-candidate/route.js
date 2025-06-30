import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

export async function POST(request) {
    try {
        const { candidateName, sessionId, adminAddress } = await request.json();

        if (!candidateName || !sessionId) {
            return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
        }
        
        // Verifikasi admin bisa ditambahkan di sini jika perlu

        // Siapkan koneksi on-chain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[String(1337)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        const tx = await contract.tambahKandidat(sessionId, candidateName);
        await tx.wait();

        // --- PERBAIKAN UTAMA DI SINI ---
        // Simpan ke database dengan nama kolom yang benar: 'nama'
        await db('kandidat').insert({
            sesi_id: sessionId,
            nama: candidateName // Diubah dari 'nama_kandidat'
        });

        return NextResponse.json({ message: `Kandidat "${candidateName}" berhasil ditambahkan ke sesi ${sessionId}` });

    } catch (error) {
        console.error("Add Candidate API Error:", error);
        return NextResponse.json({ message: 'Gagal menambahkan kandidat.', error: error.message }, { status: 500 });
    }
}