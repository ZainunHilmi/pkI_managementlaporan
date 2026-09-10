import { NextResponse } from "next/server";
import { getLaporanRange } from "@/lib/laporan";
import { requireRole } from "@/lib/api-auth";

// GET /api/laporan/export — hanya ADMIN.
// Export CSV laporan pergerakan stok dengan rentang pilihan sendiri:
//   mode=harian&tanggal=YYYY-MM-DD     → 1 hari itu
//   mode=mingguan&tanggal=YYYY-MM-DD   → Senin–Minggu yang memuat tanggal itu
//   mode=bulanan&bulan=M&tahun=YYYY    → 1 bulan penuh
// Separator ";" + BOM agar langsung rapi dibuka di Excel Indonesia.
type Mode = "harian" | "mingguan" | "bulanan";

function parseTanggal(v: string | null): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveRange(mode: Mode, url: URL): { start: Date; end: Date; label: string; tag: string } | null {
  if (mode === "bulanan") {
    const now = new Date();
    const bulan = Math.min(12, Math.max(1, parseInt(url.searchParams.get("bulan") ?? "", 10) || now.getMonth() + 1));
    const tahun = parseInt(url.searchParams.get("tahun") ?? "", 10) || now.getFullYear();
    const start = new Date(tahun, bulan - 1, 1);
    const end = new Date(tahun, bulan, 1);
    const mm = String(bulan).padStart(2, "0");
    return { start, end, label: `${mm}/${tahun}`, tag: `bulanan-${tahun}-${mm}` };
  }

  const tanggal = parseTanggal(url.searchParams.get("tanggal")) ?? new Date();
  tanggal.setHours(0, 0, 0, 0);

  if (mode === "harian") {
    const end = new Date(tanggal);
    end.setDate(end.getDate() + 1);
    return { start: tanggal, end, label: fmtID(tanggal), tag: `harian-${iso(tanggal)}` };
  }

  // Mingguan: Senin–Minggu yang memuat tanggal pilihan.
  const start = new Date(tanggal);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const last = new Date(end);
  last.setDate(last.getDate() - 1);
  return {
    start,
    end,
    label: `${fmtID(start)} – ${fmtID(last)}`,
    tag: `mingguan-${iso(start)}_sd_${iso(last)}`,
  };
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtID(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "harian") as Mode;
    if (mode !== "harian" && mode !== "mingguan" && mode !== "bulanan") {
      return NextResponse.json({ error: "Mode harus harian, mingguan, atau bulanan" }, { status: 400 });
    }

    const range = resolveRange(mode, url);
    if (!range) return NextResponse.json({ error: "Parameter tanggal tidak valid" }, { status: 400 });

    const rows = await getLaporanRange(range.start, range.end);
    const sumMasuk = rows.reduce((a, r) => a + r.totalMasuk, 0);
    const sumKeluar = rows.reduce((a, r) => a + r.totalKeluar, 0);

    const lines = [
      `Laporan Sparepart (${mode});${range.label}`,
      `Diekspor;${new Date().toLocaleString("id-ID")}`,
      ``,
      ["Sparepart", "Stok Awal", "Masuk", "Keluar", "Stok Akhir"].map(csvCell).join(";"),
      ...rows.map((r) =>
        [r.nama, r.stokAwal, r.totalMasuk, r.totalKeluar, r.stokAkhir].map(csvCell).join(";")
      ),
      ["TOTAL", "", sumMasuk, sumKeluar, ""].map(csvCell).join(";"),
    ];

    return new NextResponse(`\uFEFF${lines.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-${range.tag}.csv"`,
      },
    });
  } catch (e) {
    console.error("[GET /api/laporan/export]", e);
    return NextResponse.json({ error: "Gagal mengekspor laporan" }, { status: 500 });
  }
}
