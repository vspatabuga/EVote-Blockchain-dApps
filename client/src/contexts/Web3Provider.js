"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fungsi ini HANYA untuk menghubungkan wallet saat tombol diklik
    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            toast.error("Harap install MetaMask.");
            return false;
        }
        setIsLoading(true);
        try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await web3Provider.send("eth_requestAccounts", []);
            
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setProvider(web3Provider);
                toast.success("Wallet berhasil terhubung!");
                return true; // Mengindikasikan koneksi berhasil
            }
        } catch (error) {
            toast.error("Permintaan koneksi wallet dibatalkan.");
        } finally {
            setIsLoading(false);
        }
        return false; // Mengindikasikan koneksi gagal
    }, []);

    // Event listener untuk menangani perubahan di MetaMask (seperti ganti akun)
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                console.log("Akun diganti:", accounts[0] || "Tidak ada akun");
                setAccount(accounts[0] || null);
            };
            const handleChainChanged = () => window.location.reload();
            
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
            
            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            };
        }
    }, []);

    const contextValue = { account, provider, isLoading, connectWallet };

    return (
        <Web3Context.Provider value={contextValue}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) throw new Error("useWeb3 harus digunakan di dalam Web3Provider");
    return context;
}