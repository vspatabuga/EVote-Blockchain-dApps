import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

// Kita asumsikan verifikasi admin sudah dilakukan di level komponen/middleware nantinya
export async function POST(request) {
    try {
        const { sessionId, walletAddresses } = await request.json();

        if (!sessionId || !walletAddresses || walletAddresses.length === 0) {
            return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
        }

        // Siapkan koneksi untuk mengirim transaksi sebagai admin/owner
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[await provider.getNetwork().then(n => n.chainId)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // Panggil fungsi otorisasi di smart contract dengan array alamat wallet
        console.log(`Mengotorisasi ${walletAddresses.length} pemilih untuk Sesi ID: ${sessionId}...`);
        const tx = await contract.otorisasiPemilih(sessionId, walletAddresses);
        await tx.wait(); // Tunggu transaksi selesai

        console.log('Otorisasi on-chain berhasil.');

        // Di aplikasi nyata, Anda juga akan mengupdate status 'is_authorized_onchain' di database di sini.

        return NextResponse.json({ message: 'Semua pemilih terverifikasi berhasil diotorisasi di blockchain.' });

    } catch (error) {
        console.error("Authorize Voters API Error:", error);
        const reason = error.reason || 'Gagal melakukan otorisasi on-chain.';
        return NextResponse.json({ message: reason }, { status: 500 });
    }
}