import { NextResponse } from 'next/server';
import db from '@/lib/db';

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
        const { sessionName, adminAddress } = await request.json();
        // Di sini Anda bisa menambahkan logika untuk memanggil smart contract `mulaiSesiBaru`
        // dan mendapatkan ID on-chain jika masih diperlukan,
        // namun untuk saat ini kita fokus pada database.
        
        const [newSession] = await db('sesi_pemilihan')
            .insert({ nama_sesi: sessionName, status: 'Belum Dimulai', is_active: false })
            .returning('*');
            
        return NextResponse.json({ message: 'Sesi baru berhasil dibuat!', session: newSession });
    } catch (error) {
        console.error("Create Session API Error:", error);
        return NextResponse.json({ message: 'Gagal membuat sesi.' }, { status: 500 });
    }
}