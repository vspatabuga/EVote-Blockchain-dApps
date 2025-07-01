import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request) {
    try {
        const { nim, pic } = await request.json();

        if (!nim || !pic) {
            return NextResponse.json({ message: 'NIM dan PIC wajib diisi' }, { status: 400 });
        }

        // Menggunakan nama tabel 'pemilih' yang benar
        const pemilih = await db('pemilih').where({ nim: nim }).first();
        if (!pemilih) {
            return NextResponse.json({ message: 'NIM tidak terdaftar' }, { status: 404 });
        }

        const isPicValid = await bcrypt.compare(pic, pemilih.pic);
        if (!isPicValid) {
            return NextResponse.json({ message: 'PIC yang Anda masukkan salah' }, { status: 401 });
        }
        
        const activeSession = await db('sesi_pemilihan').where({ is_active: true }).first();
        
        let isAlreadyRegistered = false;
        if (activeSession) {
            // Menggunakan nama tabel 'registrasi' yang benar
            const existingRegistration = await db('registrasi')
                .where({ nim: nim, sesi_id: activeSession.id })
                .first();
            if (existingRegistration) {
                isAlreadyRegistered = true;
            }
        }

        return NextResponse.json({
            message: 'Validasi berhasil',
            nim: pemilih.nim,
            isRegistered: isAlreadyRegistered
        });

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}