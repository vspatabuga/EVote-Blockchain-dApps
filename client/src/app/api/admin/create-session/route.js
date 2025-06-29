import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Koneksi database
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json'; // ABI Kontrak

// Fungsi ini akan menjadi middleware atau helper di file terpisah nantinya
// Untuk sekarang, kita definisikan di sini untuk memeriksa apakah pemanggil adalah admin
async function checkAdmin(walletAddress) {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const contractAddress = Election.networks[await provider.getNetwork().then(n => n.chainId)]?.address;
    const contract = new ethers.Contract(contractAddress, Election.abi, provider);
    const owner = await contract.owner();
    return owner.toLowerCase() === walletAddress.toLowerCase();
}


export async function POST(request) {
    try {
        const { sessionName, adminAddress } = await request.json();

        // 1. Verifikasi apakah yang melakukan request adalah admin
        const isAdmin = await checkAdmin(adminAddress);
        if (!isAdmin) {
            return NextResponse.json({ message: 'Akses ditolak: Hanya admin yang dapat membuat sesi.' }, { status: 403 });
        }

        // 2. Siapkan koneksi untuk mengirim transaksi ke smart contract
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider); // Gunakan private key admin/owner
        const contractAddress = Election.networks[await provider.getNetwork().then(n => n.chainId)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        // 3. Panggil fungsi di smart contract untuk membuat sesi baru
        const tx = await contract.mulaiSesiBaru(sessionName);
        await tx.wait();
        const newSessionIdOnChain = await contract.totalSesi();

        // 4. Simpan informasi sesi baru ke database off-chain
        const [newSessionInDb] = await db('sesi_pemilihan')
            .insert({
                // Di aplikasi nyata, Anda akan menyamakan ID on-chain dan off-chain
                // Untuk kesederhanaan, kita anggap ID-nya akan cocok
                nama_sesi: sessionName,
                status: 'Belum Dimulai'
            })
            .returning('*');
        
        console.log(`Sesi baru dibuat. On-chain ID: ${newSessionIdOnChain}, Off-chain ID: ${newSessionInDb.id}`);

        return NextResponse.json({ message: 'Sesi pemilihan baru berhasil dibuat!', data: newSessionInDb });

    } catch (error) {
        console.error("Create Session API Error:", error);
        return NextResponse.json({ message: 'Gagal membuat sesi baru.' }, { status: 500 });
    }
}