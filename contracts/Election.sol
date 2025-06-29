// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Election {
    address public owner;

    uint public totalSesi;

    enum StatusSesi { BelumDimulai, Registrasi, VotingBerlangsung, Selesai }

    struct Sesi {
        uint id;
        string nama;
        StatusSesi status;
        uint jumlahKandidat;
    }

    struct Kandidat {
        uint id;
        string nama;
        uint jumlahSuara;
    }

    struct StatusPemilih {
        bool sudahMemilih;
        uint memilihKandidatId;
    }

    mapping(uint => Sesi) public daftarSesi;
    mapping(uint => mapping(uint => Kandidat)) public daftarKandidat;
    mapping(uint => mapping(address => bool)) public pemilihTerotorisasi;
    mapping(uint => mapping(address => StatusPemilih)) public statusPemilih;

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya pemilik kontrak yang bisa mengakses");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function mulaiSesiBaru(string memory _namaSesi) external onlyOwner {
        totalSesi++;
        daftarSesi[totalSesi] = Sesi(totalSesi, _namaSesi, StatusSesi.BelumDimulai, 0);
    }

    function tambahKandidat(uint _sesiId, string memory _nama) external onlyOwner {
        require(daftarSesi[_sesiId].status == StatusSesi.BelumDimulai, "Sesi sudah dimulai/selesai");
        Sesi storage sesi = daftarSesi[_sesiId];
        sesi.jumlahKandidat++;
        daftarKandidat[_sesiId][sesi.jumlahKandidat] = Kandidat(sesi.jumlahKandidat, _nama, 0);
    }

    function ubahStatusSesi(uint _sesiId, StatusSesi _statusBaru) external onlyOwner {
        daftarSesi[_sesiId].status = _statusBaru;
    }

    function otorisasiPemilih(uint _sesiId, address[] calldata _daftarAlamat) external onlyOwner {
        for (uint i = 0; i < _daftarAlamat.length; i++) {
            pemilihTerotorisasi[_sesiId][_daftarAlamat[i]] = true;
        }
    }

    function vote(uint _sesiId, uint _kandidatId) external {
        require(daftarSesi[_sesiId].status == StatusSesi.VotingBerlangsung, "Voting belum dibuka atau sudah ditutup");
        require(pemilihTerotorisasi[_sesiId][msg.sender], "Anda tidak terotorisasi untuk memilih di sesi ini");
        require(!statusPemilih[_sesiId][msg.sender].sudahMemilih, "Anda sudah memberikan suara");
        require(_kandidatId > 0 && _kandidatId <= daftarSesi[_sesiId].jumlahKandidat, "Kandidat tidak valid");

        statusPemilih[_sesiId][msg.sender].sudahMemilih = true;
        statusPemilih[_sesiId][msg.sender].memilihKandidatId = _kandidatId;
        daftarKandidat[_sesiId][_kandidatId].jumlahSuara++;
    }
}