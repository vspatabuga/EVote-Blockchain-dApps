import { NextResponse } from 'next/server';
import db from '@/lib/db';

// FUNGSI UNTUK MENGHAPUS SESI BERDASARKAN ID
export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        // Sebelum menghapus sesi, hapus semua data yang bergantung padanya
        await db('registrasi').where({ sesi_id: id }).del();
        await db('kandidat').where({ sesi_id: id }).del();
        
        // Baru hapus sesi utamanya
        const numDeleted = await db('sesi_pemilihan').where({ id: id }).del();

        if (numDeleted === 0) {
            return NextResponse.json({ message: 'Sesi tidak ditemukan.' }, { status: 404 });
        }
        return NextResponse.json({ message: `Sesi ID: ${id} berhasil dihapus.` });
    } catch (error) {
        console.error(`Error saat menghapus sesi ${id}:`, error);
        return NextResponse.json({ message: 'Gagal menghapus sesi.', error: error.message }, { status: 500 });
    }
}

// FUNGSI UNTUK MENGAKTIFKAN SATU SESI BERDASARKAN ID
export async function PUT(request, { params }) {
    const { id } = params;
    try {
        // Gunakan transaksi untuk memastikan data konsisten
        await db.transaction(async trx => {
            // 1. Set semua sesi menjadi tidak aktif
            await trx('sesi_pemilihan').update({ is_active: false });
            // 2. Set hanya sesi yang dipilih menjadi aktif
            await trx('sesi_pemilihan').where({ id: id }).update({ is_active: true });
        });
        return NextResponse.json({ message: `Sesi ID: ${id} berhasil diaktifkan.` });
    } catch (error) {
        console.error(`Error saat mengaktifkan sesi ${id}:`, error);
        return NextResponse.json({ message: 'Gagal mengaktifkan sesi.', error: error.message }, { status: 500 });
    }
}