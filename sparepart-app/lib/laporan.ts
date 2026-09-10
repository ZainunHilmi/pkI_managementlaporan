import { prisma, withDbRetry } from "@/lib/prisma";

export type LaporanRow = {
  sparepartId: string;
  nama: string;
  totalMasuk: number;
  totalKeluar: number;
  stokAwal: number;
  stokAkhir: number;
};

// Rekap bulanan per sparepart (FR-LAP-01). Dipakai halaman laporan dan
// (langkah 11) API GET /api/laporan.
export async function getLaporan(bulan: number, tahun: number): Promise<LaporanRow[]> {
  const start = new Date(tahun, bulan - 1, 1);
  const end = new Date(tahun, bulan, 1);
  return getLaporanRange(start, end);
}

// Rekap untuk rentang tanggal bebas [start, end). Dipakai fitur export
// (harian / mingguan / bulanan) — halaman laporan bulanan di atas
// hanya versi khususnya dengan start = awal bulan.
export async function getLaporanRange(start: Date, end: Date): Promise<LaporanRow[]> {

  const [spareparts, grouped] = await withDbRetry(() =>
    Promise.all([
      prisma.sparepart.findMany({
        select: { id: true, nama: true, jumlahStock: true },
        orderBy: { nama: "asc" },
        take: 500,
      }),
      prisma.stockHistory.groupBy({
        by: ["sparepartId", "type"],
        where: { createdAt: { gte: start, lt: end } },
        _sum: { jumlah: true },
      }),
    ])
  );

  const sums = new Map<string, { MASUK: number; KELUAR: number }>();
  for (const g of grouped) {
    const entry = sums.get(g.sparepartId) ?? { MASUK: 0, KELUAR: 0 };
    entry[g.type] += g._sum.jumlah ?? 0;
    sums.set(g.sparepartId, entry);
  }

  return spareparts.map((s) => {
    const totalMasuk = sums.get(s.id)?.MASUK ?? 0;
    const totalKeluar = sums.get(s.id)?.KELUAR ?? 0;
    const stokAkhir = s.jumlahStock;
    return {
      sparepartId: s.id,
      nama: s.nama,
      totalMasuk,
      totalKeluar,
      stokAwal: stokAkhir - totalMasuk + totalKeluar,
      stokAkhir,
    };
  });
}
