-- =====================================================================
-- Migrasi: 002_revisi_anggota.sql
-- Tujuan : 
--   1. Memperbarui butir 3 Kebijakan Privasi dari "Administrator Bidang Kesekretariatan" menjadi "Administrator".
--   2. Mengubah kolom alamat_orang_tua pada tabel registrasi_ulang menjadi kontak_darurat.
--
-- Cara Eksekusi:
--   CLI: mysql -u <username> -p mapala_unand < migrations/002_revisi_anggota.sql
--   phpMyAdmin: Buka database mapala_unand -> tab SQL -> salin naskah ini -> Kirim (Go).
-- =====================================================================

USE mapala_unand;

-- 1. Perbarui teks Kebijakan Privasi Butir 3
UPDATE kebijakan_privasi
SET isi = REPLACE(isi, 'Administrator Bidang Kesekretariatan', 'Administrator')
WHERE isi LIKE '%Administrator Bidang Kesekretariatan%';

-- 2. Migrasi kolom registrasi_ulang menggunakan stored procedure sementara
DROP PROCEDURE IF EXISTS _migrasi_002_kontak_darurat;

DELIMITER $$
CREATE PROCEDURE _migrasi_002_kontak_darurat()
BEGIN
  -- Tambah kolom kontak_darurat jika belum ada
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'registrasi_ulang' AND column_name = 'kontak_darurat'
  ) THEN
    ALTER TABLE registrasi_ulang ADD COLUMN kontak_darurat VARCHAR(255) NULL AFTER email;
  END IF;

  -- Salin data dari alamat_orang_tua jika kolom lama masih ada
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'registrasi_ulang' AND column_name = 'alamat_orang_tua'
  ) THEN
    UPDATE registrasi_ulang
    SET kontak_darurat = alamat_orang_tua
    WHERE (kontak_darurat IS NULL OR kontak_darurat = '') AND alamat_orang_tua IS NOT NULL;

    ALTER TABLE registrasi_ulang DROP COLUMN alamat_orang_tua;
  END IF;
END $$
DELIMITER ;

CALL _migrasi_002_kontak_darurat();
DROP PROCEDURE IF EXISTS _migrasi_002_kontak_darurat;
