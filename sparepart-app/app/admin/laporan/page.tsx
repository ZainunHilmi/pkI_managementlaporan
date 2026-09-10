import { getLaporan } from "@/lib/laporan";
import CleanupPanel from "@/components/CleanupPanel";
import { Badge, Button, Card, Input, PageHeader, Select, TableWrap, Td, Th } from "@/components/ui";

export const dynamic = "force-dynamic";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Laporan bulanan stok masuk/keluar (SRS §4.2), filter bulan + tahun.
export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: { bulan?: string; tahun?: string };
}) {
  const now = new Date();
  const bulan = Math.min(12, Math.max(1, parseInt(searchParams.bulan ?? "", 10) || now.getMonth() + 1));
  const tahun = parseInt(searchParams.tahun ?? "", 10) || now.getFullYear();

  const rows = await getLaporan(bulan, tahun);
  const sumMasuk = rows.reduce((a, r) => a + r.totalMasuk, 0);
  const sumKeluar = rows.reduce((a, r) => a + r.totalKeluar, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Laporan ${NAMA_BULAN[bulan - 1]} ${tahun}`}
        description="Rekap pergerakan stok per item."
      />
      <div className="grid animate-fade-up grid-cols-2 gap-4" style={{ animationDelay: "60ms" }}>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total masuk</p>
          <p className="text-2xl font-semibold tracking-tight text-emerald-600">+{sumMasuk}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total keluar</p>
          <p className="text-2xl font-semibold tracking-tight text-rose-600">−{sumKeluar}</p>
        </Card>
      </div>
      <Card className="animate-fade-up p-4" >
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Bulan</span>
            <Select name="bulan" defaultValue={bulan}>
              {NAMA_BULAN.map((nama, i) => (
                <option key={nama} value={i + 1}>{nama}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Tahun</span>
            <Input name="tahun" type="number" defaultValue={tahun} className="w-28" />
          </label>
          <Button type="submit" variant="secondary">
            Tampilkan
          </Button>
        </form>
      </Card>
      <Card className="animate-fade-up p-4" >
        <form method="get" action="/api/laporan/export" className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Rentang export</span>
            <Select name="mode" defaultValue="mingguan">
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan (Senin–Minggu)</option>
              <option value="bulanan">Bulanan</option>
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Tanggal (harian/mingguan)</span>
            <Input name="tanggal" type="date" defaultValue={now.toISOString().slice(0, 10)} />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Bulan (mode bulanan)</span>
            <Select name="bulan" defaultValue={bulan}>
              {NAMA_BULAN.map((nama, i) => (
                <option key={nama} value={i + 1}>{nama}</option>
              ))}
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Tahun (mode bulanan)</span>
            <Input name="tahun" type="number" defaultValue={tahun} className="w-28" />
          </label>
          <Button type="submit" variant="secondary">
            Export CSV
          </Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Harian = 1 hari pada tanggal pilihan. Mingguan = Senin–Minggu yang memuat tanggal pilihan. Bulanan = bulan + tahun pilihan. File langsung rapi dibuka di Excel.
        </p>
      </Card>
      <Card className="animate-fade-up overflow-hidden p-2" >
        <TableWrap>
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Sparepart</Th>
                <Th className="text-right">Stok Awal</Th>
                <Th className="text-right">Masuk</Th>
                <Th className="text-right">Keluar</Th>
                <Th className="text-right">Stok Akhir</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Belum ada data sparepart.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.sparepartId} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <Td className="font-medium text-slate-900">{r.nama}</Td>
                  <Td className="text-right tabular-nums">{r.stokAwal}</Td>
                  <Td className="text-right">
                    <Badge tone="emerald">+{r.totalMasuk}</Badge>
                  </Td>
                  <Td className="text-right">
                    <Badge tone="rose">−{r.totalKeluar}</Badge>
                  </Td>
                  <Td className="text-right font-semibold tabular-nums text-slate-900">{r.stokAkhir}</Td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/60 font-medium">
                  <Td className="text-slate-900">Total</Td>
                  <Td className="text-right text-slate-300">–</Td>
                  <Td className="text-right font-semibold text-emerald-700">+{sumMasuk}</Td>
                  <Td className="text-right font-semibold text-rose-700">−{sumKeluar}</Td>
                  <Td className="text-right text-slate-300">–</Td>
                </tr>
              </tfoot>
            )}
          </table>
        </TableWrap>
      </Card>
      <CleanupPanel />
    </div>
  );
}
