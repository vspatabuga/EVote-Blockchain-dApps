import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
    try {
        const { nim, sesiId } = await request.json();
        if (!nim || !sesiId) {
            return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
        }

        const existingRegistration = await db('registrasi')
            .where({ nim, sesi_id: sesiId })
            .first();

        return NextResponse.json({ isRegistered: !!existingRegistration });
        
    } catch (error) {
        return NextResponse.json({ message: "Error server" }, { status: 500 });
    }
}