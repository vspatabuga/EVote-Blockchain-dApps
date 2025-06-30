/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('sesi_pemilihan', function (table) {
    // Tambahkan kolom 'is_active' dengan tipe boolean, tidak boleh null,
    // dan nilai default-nya adalah false.
    table.boolean('is_active').notNullable().defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Fungsi 'down' adalah untuk rollback, yaitu menghapus kolom jika diperlukan.
  return knex.schema.table('sesi_pemilihan', function (table) {
    table.dropColumn('is_active');
  });
};