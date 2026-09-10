import Link from "next/link";
import { prisma, withDbRetry } from "@/lib/prisma";
import { dummyWeeklyNet, dummyWeeklyStats, dummyWeeklyTotals } from "@/lib/dummy-stats";
import StockBadge from "@/components/StockBadge";
import WeeklyChart from "@/components/WeeklyChart";
import { Badge, ButtonLink, Card, PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

// Dashboard admin: ringkasan total, stok menipis, transaksi bulan ini (SRS §4.2).
export default async function AdminDashboardPage() {
  // Satu withDbRetry untuk seluruh batch: 4 query jalan paralel dan butuh
  // 4 koneksi sekaligus — saat user pindah halaman cepat, pool bisa penuh
  // (P2024) sehingga batch ini diulang dengan backoff, bukan langsung error.
  const [totalSparepart, totalUsers, items, transaksiBulanIni] = await withDbRetry(() =>
    Promise.all([
      prisma.sparepart.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.sparepart.findMany({
        select: { id: true, nama: true, jumlahStock: true, threshold: true, lokasi: true },
        orderBy: { jumlahStock: "asc" },
        take: 200,
      }),
      prisma.stockHistory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])
  );

  const menipis = items.filter((i) => i.jumlahStock < i.threshold);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan inventaris dan aktivitas bulan berjalan."
        actions={
          <ButtonLink href="/admin/sparepart/tambah">+ Tambah Sparepart</ButtonLink>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sparepart" value={totalSparepart} delay="60ms" icon={<IconBox />} />
        <StatCard label="Stok Menipis" value={menipis.length} danger={menipis.length > 0} delay="120ms" icon={<IconAlert />} />
        <StatCard label="Pengguna Aktif" value={totalUsers} delay="180ms" icon={<IconUsers />} />
        <StatCard label="Transaksi Bulan Ini" value={transaksiBulanIni} delay="240ms" icon={<IconSwap />} />
      </div>

      {/* Aktivitas 7 hari — PREVIEW dengan data dummy (lib/dummy-stats.ts).
          Single Value / Scorecard: Masuk vs Keluar + grafik interaktif
          (tab metrik, tooltip, rata-rata) di components/WeeklyChart.tsx. */}
      <section aria-label="Aktivitas 7 hari terakhir">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Aktivitas 7 hari terakhir
          </h2>
          <Badge tone="amber">Preview — data dummy</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Stok masuk (7 hari)" value={`+${dummyWeeklyTotals.masuk}`} tone="teal" delay="60ms" icon={<IconIn />} />
          <StatCard label="Stok keluar (7 hari)" value={`−${dummyWeeklyTotals.keluar}`} danger delay="120ms" icon={<IconOut />} />
          <StatCard
            label="Bersih (7 hari)"
            value={`${dummyWeeklyNet >= 0 ? "+" : "−"}${Math.abs(dummyWeeklyNet)}`}
            danger={dummyWeeklyNet < 0}
            delay="180ms"
            icon={<IconNet />}
          />
        </div>
        <Card className="animate-fade-up mt-4 p-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Tren harian — klik tab metrik & arahkan kursor ke batang
            </h3>
            <p className="text-xs text-slate-400">
              Total minggu ini: {dummyWeeklyTotals.total} pergerakan
            </p>
          </div>
          <WeeklyChart data={dummyWeeklyStats} />
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up p-5 lg:col-span-2" >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Perlu perhatian
            </h2>
            {menipis.length > 0 && (
              <Link href="/admin/sparepart" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Lihat semua →
              </Link>
            )}
          </div>
          {menipis.length === 0 ? (
            <p className="rounded-xl bg-emerald-50/70 px-4 py-6 text-center text-sm text-emerald-700">
              Semua stok aman. Tidak ada item di bawah threshold.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {menipis.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{i.nama}</span>
                    <span className="block text-xs text-slate-400">{i.lokasi}</span>
                  </span>
                  <StockBadge jumlahStock={i.jumlahStock} threshold={i.threshold} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="animate-fade-up p-5" >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Aksi cepat
          </h2>
          <div className="space-y-2">
            <QuickLink href="/admin/sparepart/tambah" title="Tambah sparepart" desc="Catat item baru + foto" />
            <QuickLink href="/admin/users" title="Kelola pengguna" desc="Akun teknisi & admin" />
            <QuickLink href="/admin/laporan" title="Lihat laporan" desc="Rekap bulan berjalan" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-slate-200/70 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-soft"
    >
      <span>
        <span className="block text-sm font-medium text-slate-800 group-hover:text-indigo-700">{title}</span>
        <span className="block text-xs text-slate-400">{desc}</span>
      </span>
      <span className="text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" aria-hidden>→</span>
    </Link>
  );
}

function IconBox() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSwap() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}

function IconIn() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

function IconOut() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function IconNet() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14 4-4 4 3 5-6" />
    </svg>
  );
}
