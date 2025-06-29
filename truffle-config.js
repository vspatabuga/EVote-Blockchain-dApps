module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1337", // <-- Diperbarui untuk keamanan dan konsistensi
    },
  },

  // Tentukan lokasi output hasil kompilasi (ABI)
  contracts_build_directory: './client/src/contracts/',

  compilers: {
    solc: {
      version: "0.8.19",
      optimizer: {
        enabled: true,
        runs: 200
      },
    }
  }
};