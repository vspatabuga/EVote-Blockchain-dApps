const bcrypt = require('bcrypt');
const saltRounds = 10;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Hapus data lama dalam urutan yang benar untuk menghindari error foreign key
  await knex('registrasi').del();
  await knex('kandidat').del();
  await knex('sesi_pemilihan').del();
  await knex('pemilih').del();

  // 1. Buat data master pemilih
  const pemilihData = [
    { nim: '201910370311112', pic: '123456' },
    { nim: '201910370311113', pic: '654321' },
    { nim: '201910370311114', pic: '112233' }
  ];
  const pemilihToInsert = await Promise.all(
    pemilihData.map(async (p) => {
      const hashedPic = await bcrypt.hash(p.pic, saltRounds);
      return { nim: p.nim, pic: hashedPic };
    })
  );
  await knex('pemilih').insert(pemilihToInsert);
  console.log('Data pemilih berhasil dimasukkan.');

  // 2. Buat sesi pemilihan pertama secara manual dengan ID yang pasti
  // PERBAIKAN UTAMA DI SINI
  await knex('sesi_pemilihan').insert({
    id: 1, // Secara eksplisit definisikan ID pertama
    nama_sesi: 'Pemilu Raya BEM 2025',
    status: 'Belum Dimulai',
    is_active: true // Jadikan sesi pertama ini langsung aktif
  });
  console.log('Sesi pemilihan pertama berhasil dibuat.');

  // 3. Tambahkan kandidat untuk sesi pertama (ID: 1)
  await knex('kandidat').insert([
    { sesi_id: 1, nama_kandidat: 'Kandidat A' },
    { sesi_id: 1, nama_kandidat: 'Kandidat B' }
  ]);
  console.log('Data kandidat berhasil dimasukkan.');
};