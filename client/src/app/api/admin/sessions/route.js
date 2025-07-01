import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import db from '@/lib/db';
import Election from '@/contracts/Election.json';

// MENGAMBIL SEMUA SESI (GET)
export async function GET() {
    try {
        const sessions = await db('sesi_pemilihan').orderBy('id', 'asc');
        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Get All Sessions API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil daftar sesi.' }, { status: 500 });
    }
}

// MEMBUAT SESI BARU (POST)
export async function POST(request) {
    try {
        const { sessionName } = await request.json();

        // 1. Siapkan koneksi on-chain sebagai admin
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        // Gunakan variabel yang lebih sesuai, pastikan ini ada di .env.local Anda
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider); 
        const contractAddress = Election.networks[String(1337)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // 2. Panggil fungsi di smart contract untuk membuat sesi on-chain
        const tx = await contract.mulaiSesiBaru(sessionName);
        await tx.wait();
        
        // 3. Ambil ID yang baru saja dibuat oleh smart contract
        const newSessionIdOnChain = await contract.totalSesi();

        // 4. Gunakan transaksi database untuk menyimpan data dengan ID yang sinkron
        await db.transaction(async trx => {
            // Set semua sesi yang ada menjadi tidak aktif terlebih dahulu
            await trx('sesi_pemilihan').update({ is_active: false });

            // Buat sesi baru di database dengan ID dari on-chain dan langsung aktifkan
            await trx('sesi_pemilihan').insert({
                id: Number(newSessionIdOnChain),
                nama_sesi: sessionName,
                status: 'Belum Dimulai',
                is_active: true
            });
        });

        return NextResponse.json({ message: `Sesi "${sessionName}" berhasil dibuat dan diaktifkan.` });

    } catch (error) {
        console.error("Create Session API Error:", error);
        return NextResponse.json({ message: 'Gagal membuat sesi baru.', error: error.message }, { status: 500 });
    }
}