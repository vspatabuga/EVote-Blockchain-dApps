/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Tabel untuk data master pemilih yang berhak, tidak berubah antar sesi
    .createTable('pemilih', function (table) {
      table.string('nim', 20).primary(); // NIM sebagai Primary Key
      table.string('pic', 255).notNullable(); // PIC untuk validasi awal
    })
    // Tabel untuk mencatat setiap sesi pemilihan yang dibuat admin
    .createTable('sesi_pemilihan', function(table) {
      table.increments('id').primary();
      table.string('nama_sesi', 255).notNullable();
      table.string('status', 50).defaultTo('Belum Dimulai'); // cth: Belum Dimulai, Registrasi, Berlangsung, Selesai
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Tabel untuk kandidat yang terikat pada setiap sesi
    .createTable('kandidat', function(table) {
        table.increments('id').primary();
        table.integer('sesi_id').unsigned().notNullable();
        table.string('nama', 255).notNullable();
        // vote_count DIHAPUS dari sini, karena akan dihitung di Smart Contract
        
        table.foreign('sesi_id').references('id').inTable('sesi_pemilihan');
    })
    // Tabel registrasi yang menjadi jembatan antara pemilih, sesi, dan wallet
    .createTable('registrasi', function(table) {
        table.increments('id').primary();
        table.integer('sesi_id').unsigned().notNullable();
        table.string('nim', 20).notNullable();
        table.string('wallet_address', 42).unique(); // Wallet harus unik di seluruh sistem untuk mencegah satu wallet dipakai banyak NIM

        // Foreign keys
        table.foreign('sesi_id').references('id').inTable('sesi_pemilihan');
        table.foreign('nim').references('nim').inTable('pemilih');

        // Memastikan satu NIM hanya bisa registrasi sekali per sesi
        table.unique(['sesi_id', 'nim']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Rollback dalam urutan terbalik untuk menjaga integritas foreign key
  return knex.schema
    .dropTableIfExists('registrasi')
    .dropTableIfExists('kandidat')
    .dropTableIfExists('sesi_pemilihan')
    .dropTableIfExists('pemilih');
};