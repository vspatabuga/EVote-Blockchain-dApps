import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET handler untuk mengambil semua sesi
export async function GET() {
    try {
        // Ambil semua sesi dari database, urutkan dari yang terbaru
        const sessions = await db('sesi_pemilihan').select('*').orderBy('id', 'desc');
        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Get All Sessions API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil daftar sesi' }, { status: 500 });
    }
}