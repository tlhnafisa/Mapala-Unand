-- =====================================================================
-- Migrasi: 001_sorotan_tunggal.sql
-- Tujuan : Memastikan hanya ada maksimal 1 prestasi aktif sebagai sorotan di Beranda.
-- Aturan : Jika terdapat lebih dari 1 record prestasi dengan is_sorotan = 1 di database,
--          pertahankan hanya record terbaru (id terbesar) dan nonaktifkan sisanya (is_sorotan = 0).
--
-- Cara Eksekusi:
--   CLI: mysql -u <username> -p mapala_unand < migrations/001_sorotan_tunggal.sql
--   phpMyAdmin: Buka database mapala_unand -> tab SQL -> salin naskah di bawah -> Kirim (Go).
-- =====================================================================

USE mapala_unand;

UPDATE prestasi
SET is_sorotan = 0
WHERE is_sorotan = 1
  AND id < (
    SELECT COALESCE(MAX(id), 0)
    FROM (SELECT id, is_sorotan FROM prestasi) AS p
    WHERE p.is_sorotan = 1
  );
