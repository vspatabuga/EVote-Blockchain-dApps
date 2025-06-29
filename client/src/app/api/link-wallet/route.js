import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';

export async function POST(request) {
    try {
        const { nim, walletAddress, sesiId } = await request.json();

        if (!nim || !walletAddress || !sesiId || !ethers.isAddress(walletAddress)) {
            return NextResponse.json({ message: 'Data tidak valid' }, { status: 400 });
        }

        // --- PERUBAHAN UTAMA DI SINI ---
        // Operasi "Upsert" menggunakan Knex untuk PostgreSQL
        const [registration] = await db('registrasi')
            .insert({
                sesi_id: sesiId,
                nim: nim,
                wallet_address: walletAddress,
            })
            // Jika terjadi konflik pada kombinasi (sesi_id, nim), jangan error.
            .onConflict(['sesi_id', 'nim'])
            // Sebaliknya, UPDATE kolom wallet_address dengan nilai yang baru.
            .merge({
                wallet_address: walletAddress,
            })
            .returning('*'); // Kembalikan baris yang di-insert atau di-update

        return NextResponse.json({ message: 'Wallet berhasil ditautkan!', data: registration });

    } catch (error) {
        // Blok catch ini sekarang hanya akan menangani error tak terduga
        // atau jika wallet yang sama mencoba dipakai oleh NIM yang berbeda.
        if (error.code === '23505') { 
            return NextResponse.json({ message: 'Alamat Wallet ini sudah terdaftar oleh pengguna lain.' }, { status: 409 });
        }
        
        console.error('Link Wallet API Error:', error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}