// Kebijakan retensi database tier gratis: riwayat stok hanya disimpan
// 3 bulan terakhir (bulan berjalan + 3 bulan ke belakang dihitung dari
// awal bulan). Dipakai API cleanup dan panel admin.
export const RETENTION_MONTHS = 3;
export const CLEANUP_BATCH_SIZE = 1000;
export const CLEANUP_MAX_BATCHES = 100; // pengaman: maks 100rb baris per eksekusi

export function getCleanupCutoff(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() - RETENTION_MONTHS, 1);
}

export function cutoffLabel(cutoff: Date) {
  return cutoff.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
