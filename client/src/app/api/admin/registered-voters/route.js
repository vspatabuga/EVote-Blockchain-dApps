import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

     // --- DEBUGGING DITAMBAHKAN DI SINI ---
    console.log('--- API /api/admin/registered-voters (ADMIN) ---');
    console.log('Menerima permintaan untuk mengambil daftar pemilih.');
    console.log('Meminta dari Sesi ID:', sessionId);
    console.log('-----------------------------------------------');
    // --- AKHIR DEBUGGING ---

    if (!sessionId) {
        return NextResponse.json({ message: 'Session ID diperlukan' }, { status: 400 });
    }

    try {
        // Menggunakan nama tabel 'registrasi' yang benar
        const voters = await db('registrasi')
            .where({ sesi_id: sessionId })
            .select('id as registrasi_id', 'nim', 'wallet_address'); // Mengambil kolom yang relevan

        return NextResponse.json(voters);
    } catch (error) {
        console.error("Get Registered Voters API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil data pemilih terdaftar.' }, { status: 500 });
    }
}