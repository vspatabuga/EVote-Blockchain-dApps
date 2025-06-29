import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';

// PERBAIKAN: Path diubah dari '../../' menjadi '../'
// Ini akan mengarah dengan benar ke root proyek: /srv/evote-apps/database.env
const envPath = path.resolve(process.cwd(), '../database.env');

const result = dotenv.config({ path: envPath });

// Jika gagal memuat file .env, berikan error yang jelas
if (result.error) {
  throw new Error(`Gagal memuat file database.env: ${result.error}`);
}

// Gunakan variabel yang baru dimuat untuk konfigurasi Knex
const dbConfig = {
  client: 'pg',
  connection: {
    host: result.parsed.DB_HOST,
    user: result.parsed.DB_USER,
    password: result.parsed.DB_PASSWORD,
    database: result.parsed.DB_DATABASE,
    port: result.parsed.DB_PORT,
  },
  pool: {
    min: 2,
    max: 10
  }
};

const db = knex(dbConfig);

export default db;