import { Inter } from 'next/font/google';
import { Web3Provider } from '@/contexts/Web3Provider'; // Menggunakan path alias
import { Toaster } from 'react-hot-toast';

// Impor CSS Bootstrap sekali saja di sini
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'dApp E-Voting',
  description: 'Aplikasi E-Voting Terdesentralisasi Berbasis Blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {/* Komponen Toaster untuk notifikasi yang cantik */}
          <Toaster
            position="top-center"
            reverseOrder={false}
          />
          {/* {children} akan menjadi halaman yang dirender (page.js atau dashboard/page.js) */}
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}