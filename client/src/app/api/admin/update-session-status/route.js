import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

// Mapping dari teks ke nomor status di Solidity
const statusToEnum = {
    'Registrasi': 1,
    'VotingBerlangsung': 2,
    'Selesai': 3
};

export async function POST(request) {
    try {
        const { newStatus, sessionId, adminAddress } = await request.json();

        // VALIDASI: Pastikan semua data yang dibutuhkan ada
        if (!newStatus || !sessionId || !statusToEnum.hasOwnProperty(newStatus)) {
            return NextResponse.json({ message: 'Data tidak lengkap atau status tidak valid.' }, { status: 400 });
        }
        
        // Siapkan koneksi on-chain untuk memanggil smart contract
        // Anda bisa menggunakan private key admin dari .env di sini
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider); 
        const contractAddress = Election.networks[String(1337)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // Panggil fungsi di smart contract
        const tx = await contract.ubahStatusSesi(sessionId, statusToEnum[newStatus]);
        await tx.wait(); // Tunggu hingga transaksi dikonfirmasi

        // Perbarui juga status di database off-chain
        await db('sesi_pemilihan')
            .where({ id: sessionId })
            .update({ status: newStatus });

        return NextResponse.json({ message: `Status sesi ${sessionId} berhasil diperbarui menjadi ${newStatus}` });

    } catch (error) {
        console.error("Update Session Status API Error:", error);
        return NextResponse.json({ message: 'Gagal memperbarui status sesi.', error: error.message }, { status: 500 });
    }
}