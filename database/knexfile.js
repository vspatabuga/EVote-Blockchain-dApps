// Anda mungkin perlu menginstal: npm install pg dotenv
require('dotenv').config({ path: '../client/.env.local' }); // Mengambil variabel dari .env.local di folder client

module.exports = {
  development: {
    client: 'pg', // atau 'mysql', 'sqlite3'
    connection: {
      host: process.env.PGHOST,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  // Anda bisa menambahkan konfigurasi untuk production, etc.
};