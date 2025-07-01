import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';

export async function POST(request) {
    try {
        const { nim, walletAddress, sesiId } = await request.json();

        // --- DEBUGGING DITAMBAHKAN DI SINI ---
        console.log('--- API /api/link-wallet (PEMILIH) ---');
        console.log('Menerima permintaan registrasi:');
        console.log('NIM:', nim);
        console.log('Wallet Address:', walletAddress);
        console.log('Menyimpan ke Sesi ID:', sesiId);
        console.log('------------------------------------');
        // --- AKHIR DEBUGGING ---

        if (!nim || !walletAddress || !sesiId || !ethers.isAddress(walletAddress)) {
            return NextResponse.json({ message: 'Data tidak valid' }, { status: 400 });
        }

        // Menggunakan nama tabel 'registrasi' yang benar
        const [registration] = await db('registrasi')
            .insert({
                sesi_id: sesiId,
                nim: nim,
                wallet_address: walletAddress,
            })
            .onConflict(['sesi_id', 'nim'])
            .merge({
                wallet_address: walletAddress,
            })
            .returning('*');

        return NextResponse.json({ message: 'Wallet berhasil ditautkan!', data: registration });

    } catch (error) {
        if (error.code === '23505') { 
            return NextResponse.json({ message: 'Alamat Wallet ini sudah digunakan oleh NIM lain di sesi ini.' }, { status: 409 });
        }
        console.error('Link Wallet API Error:', error);
        return NextResponse.json({ message: 'Gagal menautkan wallet.' }, { status: 500 });
    }
}