const bcrypt = require('bcrypt');
const saltRounds = 10; // Standar untuk hashing password

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Hapus data lama agar tidak duplikat setiap kali seed dijalankan
  await knex('registrasi').del();
  await knex('kandidat').del();
  await knex('sesi_pemilihan').del();
  await knex('pemilih').del();

  // 1. Buat sesi pemilihan pertama
  const [sesiId] = await knex('sesi_pemilihan').insert({
    nama_sesi: 'Pemilu Raya BEM 2025',
    status: 'Registrasi' // Langsung buka status registrasi
  }).returning('id');

  // 2. Siapkan data pemilih (NIM dan PIC asli)
  const pemilihData = [
    { nim: '201910370311112', pic: '123456' },
    { nim: '201910370311113', pic: '654321' },
    { nim: '201910370311114', pic: '112233' }
  ];

  // Hash PIC sebelum dimasukkan ke database
  const pemilihToInsert = await Promise.all(
    pemilihData.map(async (p) => {
      const hashedPic = await bcrypt.hash(p.pic, saltRounds);
      return { nim: p.nim, pic: hashedPic };
    })
  );

  // Masukkan data pemilih ke tabel 'pemilih'
  await knex('pemilih').insert(pemilihToInsert);
  console.log('Data pemilih berhasil dimasukkan.');

  // 3. (Opsional) Tambahkan kandidat untuk sesi pertama
  await knex('kandidat').insert([
    { sesi_id: sesiId.id, nama: 'Kandidat A' },
    { sesi_id: sesiId.id, nama: 'Kandidat B' }
  ]);
  console.log('Data kandidat berhasil dimasukkan.');
};