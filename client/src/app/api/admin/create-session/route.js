import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

export async function POST(request) {
    try {
        const { sessionName, adminAddress } = await request.json();
        // Anda bisa menambahkan verifikasi admin di sini

        // 1. Siapkan koneksi on-chain
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[String(1337)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // 2. Panggil fungsi di smart contract untuk membuat sesi on-chain
        const tx = await contract.mulaiSesiBaru(sessionName);
        await tx.wait();
        
        // 3. Simpan sesi ke database off-chain TANPA menyertakan ID manual
        // Biarkan database yang membuat ID-nya sendiri secara otomatis.
        await db.transaction(async trx => {
            // Set semua sesi yang ada menjadi tidak aktif
            await trx('sesi_pemilihan').update({ is_active: false });

            // Buat sesi baru dan set sebagai aktif
            await trx('sesi_pemilihan').insert({
                nama_sesi: sessionName,
                status: 'Belum Dimulai',
                is_active: true
            });
        });

        return NextResponse.json({ message: `Sesi "${sessionName}" berhasil dibuat dan diaktifkan.` });

    } catch (error) {
        console.error("Create Session API Error:", error);
        // Tangani error jika nama sesi sudah ada, atau error lainnya
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ message: 'Nama sesi sudah digunakan.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Gagal membuat sesi baru.' }, { status: 500 });
    }
}