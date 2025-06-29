import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Impor koneksi database dari lib/db.js
import bcrypt from 'bcrypt';

export async function POST(request) {
    try {
        // 1. Ambil data NIM dan PIC dari request frontend
        const { nim, pic } = await request.json();

        if (!nim || !pic) {
            return NextResponse.json({ message: 'NIM dan PIC wajib diisi' }, { status: 400 });
        }

        // 2. Cari pemilih di tabel 'pemilih' berdasarkan NIM
        const pemilih = await db('pemilih').where({ nim: nim }).first();

        // 3. Jika NIM tidak ditemukan, kirim error
        if (!pemilih) {
            return NextResponse.json({ message: 'NIM tidak terdaftar' }, { status: 404 });
        }

        // 4. Jika NIM ditemukan, bandingkan PIC yang diinput dengan hash PIC di database
        const isPicValid = await bcrypt.compare(pic, pemilih.pic);

        if (isPicValid) {
            // 5. Jika PIC valid, kirim respons berhasil
            return NextResponse.json({ message: 'Validasi berhasil', nim: pemilih.nim });
        } else {
            // 6. Jika PIC tidak valid, kirim error
            return NextResponse.json({ message: 'PIC yang Anda masukkan salah' }, { status: 401 });
        }

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
    }
}