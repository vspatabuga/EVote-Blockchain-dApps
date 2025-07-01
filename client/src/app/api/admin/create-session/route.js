import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

export async function POST(request) {
    try {
        const { sessionName } = await request.json();
        
        // Siapkan koneksi on-chain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[String(1337)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // Panggil fungsi di smart contract
        const tx = await contract.mulaiSesiBaru(sessionName);
        await tx.wait();
        
        // Ambil ID yang baru saja dibuat oleh smart contract
        const newSessionIdOnChain = await contract.totalSesi();

        // Gunakan transaksi database untuk memastikan konsistensi
        await db.transaction(async trx => {
            await trx('sesi_pemilihan').update({ is_active: false });
            await trx('sesi_pemilihan').insert({
                // GUNAKAN ID DARI ON-CHAIN
                id: Number(newSessionIdOnChain), 
                nama_sesi: sessionName,
                status: 'Belum Dimulai',
                is_active: true
            });
        });

        return NextResponse.json({ message: `Sesi "${sessionName}" berhasil dibuat.` });
    } catch (error) {
        console.error("Create Session API Error:", error);
        return NextResponse.json({ message: 'Gagal membuat sesi baru.' }, { status: 500 });
    }
}