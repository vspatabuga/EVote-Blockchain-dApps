import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Koneksi database
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json'; // ABI Kontrak

// Helper untuk verifikasi admin (bisa diekstrak ke file terpisah nanti)
async function checkAdmin(walletAddress) {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const contractAddress = Election.networks[await provider.getNetwork().then(n => n.chainId)]?.address;
    const contract = new ethers.Contract(contractAddress, Election.abi, provider);
    const owner = await contract.owner();
    return owner.toLowerCase() === walletAddress.toLowerCase();
}

export async function POST(request) {
    try {
        const { candidateName, sessionId, adminAddress } = await request.json();

        // 1. Validasi input dan verifikasi admin
        if (!candidateName || !sessionId || !adminAddress) {
            return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
        }
        const isAdmin = await checkAdmin(adminAddress);
        if (!isAdmin) {
            return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
        }

        // 2. Siapkan koneksi untuk mengirim transaksi ke smart contract
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[await provider.getNetwork().then(n => n.chainId)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);
        
        // 3. Panggil fungsi di smart contract untuk menambah kandidat
        const tx = await contract.tambahKandidat(sessionId, candidateName);
        await tx.wait(); // Tunggu transaksi dikonfirmasi
        
        // 4. Simpan informasi kandidat ke database off-chain
        const [newCandidateInDb] = await db('kandidat')
            .insert({
                sesi_id: sessionId,
                nama: candidateName
            })
            .returning('*');
            
        console.log(`Kandidat baru ditambahkan: ${candidateName} untuk Sesi ID: ${sessionId}`);

        return NextResponse.json({ message: 'Kandidat berhasil ditambahkan!', data: newCandidateInDb });

    } catch (error) {
        console.error("Add Candidate API Error:", error);
        // Memberikan pesan error yang lebih spesifik jika ada
        const reason = error.reason || 'Gagal menambahkan kandidat.';
        return NextResponse.json({ message: reason }, { status: 500 });
    }
}