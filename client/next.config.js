/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opsi ini akan menghilangkan peringatan cross-origin
  allowedDevOrigins: ["http://35.222.9.179:3000"],
  
  // Opsi ini untuk mengatasi error build 'knex'
  serverExternalPackages: ['knex', 'pg'],

  // Opsi ini untuk mengatasi error CSP 'unsafe-eval'
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;