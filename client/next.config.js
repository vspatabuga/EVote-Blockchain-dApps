/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opsi ini untuk mengatasi error build 'knex' di sisi server
  serverExternalPackages: ['knex', 'pg'],

  // Opsi untuk mengatur header Content Security Policy
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // PERBAIKAN: Aturan yang lebih lengkap untuk produksi
            value: [
              "default-src 'self' https://final-project.vspatabuga.io;",
              // Menambahkan 'unsafe-inline' sangat penting untuk build produksi Next.js
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://final-project.vspatabuga.io;",
              "style-src 'self' 'unsafe-inline' https://final-project.vspatabuga.io;",
              "img-src 'self' data:;",
              "font-src 'self' https://final-project.vspatabuga.io;",
              // Izinkan koneksi ke Ganache dan domain Anda sendiri
              "connect-src 'self' http://35.222.9.179:8545 https://final-project.vspatabuga.io;",
            ].join(' '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;