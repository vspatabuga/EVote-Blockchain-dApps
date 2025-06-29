import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ethers } from 'ethers';
import Election from '@/contracts/Election.json';

// Helper verifikasi admin dengan sintaks Ethers v6 yang sudah diperbaiki
async function checkAdmin(walletAddress) {
    // PERBAIKAN: Gunakan ethers.JsonRpcProvider langsung
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Pastikan port 8545
    const network = await provider.getNetwork();
    const contractAddress = Election.networks[String(network.chainId)]?.address;
    
    if (!contractAddress) throw new Error("Contract address not found for this network.");

    const contract = new ethers.Contract(contractAddress, Election.abi, provider);
    const owner = await contract.owner();
    return owner.toLowerCase() === walletAddress.toLowerCase();
}

export async function POST(request) {
    try {
        const { sessionId, newStatus, adminAddress } = await request.json();

        if (!sessionId || !newStatus || !adminAddress) {
            return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
        }
        const isAdmin = await checkAdmin(adminAddress);
        if (!isAdmin) {
            return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
        }

        const statusEnum = { 'Belum Dimulai': 0, 'Registrasi': 1, 'VotingBerlangsung': 2, 'Selesai': 3 };
        const statusValue = statusEnum[newStatus];
        if (statusValue === undefined) {
            return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
        }

        // PERBAIKAN: Gunakan ethers.JsonRpcProvider langsung
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const signer = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);
        const contractAddress = Election.networks[String((await provider.getNetwork()).chainId)]?.address;
        const contract = new ethers.Contract(contractAddress, Election.abi, signer);

        const tx = await contract.ubahStatusSesi(sessionId, statusValue);
        await tx.wait();

        await db('sesi_pemilihan').where({ id: sessionId }).update({ status: newStatus });
        
        return NextResponse.json({ message: `Status sesi berhasil diubah menjadi "${newStatus}"` });

    } catch (error) {
        console.error("===================================");
        console.error("DETAIL ERROR DI API UPDATE STATUS:");
        console.error("Pesan Error:", error.message);
        console.error("Reason (jika ada):", error.reason);
        console.error("===================================");
        const reason = error.reason || 'Gagal mengubah status sesi.';
        return NextResponse.json({ message: reason }, { status: 500 });
    }
}