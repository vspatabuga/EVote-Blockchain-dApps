import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ message: 'ID Sesi diperlukan' }, { status: 400 });
        }

        // PERBAIKAN: Mengganti .andWhereNotNull() menjadi .whereNotNull()
        const registeredVoters = await db('registrasi')
            .where({ sesi_id: sessionId })
            .whereNotNull('wallet_address'); // Metode yang benar adalah whereNotNull()

        return NextResponse.json(registeredVoters);

    } catch (error) {
        // Log error yang lebih detail di sisi server
        console.error("Get Registered Voters API Error:", error);
        return NextResponse.json({ message: 'Gagal mengambil data pendaftar' }, { status: 500 });
    }
}