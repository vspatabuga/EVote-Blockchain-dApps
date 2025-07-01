/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('pemilih', function (table) {
      table.string('nim', 20).primary();
      table.string('pic', 255).notNullable();
    })
    .createTable('sesi_pemilihan', function(table) {
      // Dibuat sebagai INTEGER PRIMARY KEY agar bisa sinkron dengan on-chain
      table.integer('id').primary(); 
      table.string('nama_sesi', 255).notNullable();
      // HANYA SATU DEFINISI UNTUK 'status'
      table.string('status', 50).defaultTo('Belum Dimulai');
      table.boolean('is_active').notNullable().defaultTo(false);
    })
    .createTable('kandidat', function(table) {
      table.increments('id').primary();
      table.integer('sesi_id').unsigned().notNullable();
      table.string('nama_kandidat', 255).notNullable();
      // Foreign key ke tabel sesi_pemilihan
      table.foreign('sesi_id').references('id').inTable('sesi_pemilihan').onDelete('CASCADE');
    })
    .createTable('registrasi', function(table) {
      table.increments('id').primary();
      table.integer('sesi_id').unsigned().notNullable();
      table.string('nim', 20).notNullable();
      table.string('wallet_address', 42).notNullable();
      
      table.foreign('sesi_id').references('id').inTable('sesi_pemilihan').onDelete('CASCADE');
      table.foreign('nim').references('nim').inTable('pemilih').onDelete('CASCADE');

      // Aturan unik untuk kombinasi sesi dan wallet
      table.unique(['sesi_id', 'wallet_address']);
      table.unique(['sesi_id', 'nim']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Rollback dalam urutan terbalik
  return knex.schema
    .dropTableIfExists('registrasi')
    .dropTableIfExists('kandidat')
    .dropTableIfExists('sesi_pemilihan')
    .dropTableIfExists('pemilih');
};