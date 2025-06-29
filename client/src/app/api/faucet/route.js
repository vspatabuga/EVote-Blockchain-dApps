import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(request) {
    try {
        const { address } = await request.json();

        // Perbaikan Ethers v6: ethers.isAddress() langsung
        if (!address || !ethers.isAddress(address)) {
            return NextResponse.json({ message: 'Alamat wallet tidak valid' }, { status: 400 });
        }
        
        // Perbaikan Ethers v6: Gunakan ethers.JsonRpcProvider
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

        const faucetWallet = new ethers.Wallet(process.env.FAUCET_PRIVATE_KEY, provider);

        // Perbaikan Ethers v6: Gunakan ethers.parseEther()
        const tx = await faucetWallet.sendTransaction({
            to: address,
            value: ethers.parseEther('0.1'),
        });

        await tx.wait();

        console.log(`Faucet successful: Sent 0.1 ETH to ${address}, tx: ${tx.hash}`);

        return NextResponse.json({ message: `Berhasil mengirim 0.1 ETH.` });

    } catch (error) {
        console.error('Faucet API Error:', error);
        return NextResponse.json({ message: 'Gagal mengirim dana, terjadi kesalahan pada server.' }, { status: 500 });
    }
}