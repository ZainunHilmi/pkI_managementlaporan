import Link from "next/link";
import { BrandMark } from "@/components/ui";

// Landing: tamu diarahkan masuk, sesi aktif ditangani middleware (/ → dashboard).
const FEATURES = [
  {
    title: "Stok real-time",
    desc: "Setiap pemakaian tercatat langsung, stok selalu terkini.",
  },
  {
    title: "Peringatan menipis",
    desc: "Badge otomatis saat stok di bawah batas minimum.",
  },
  {
    title: "Laporan bulanan",
    desc: "Rekap masuk & keluar per bulan tanpa rekap manual.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="flex animate-fade-up items-center justify-center gap-3">
          <BrandMark />
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Manajemen Sparepart
          </h1>
        </div>
        <p className="mx-auto mt-3 max-w-xl animate-fade-up text-balance text-slate-500" style={{ animationDelay: "80ms" }}>
          Kelola inventaris suku cadang, pantau stok menipis, dan rekap laporan
          bulanan dalam satu aplikasi.
        </p>
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-indigo-500 hover:shadow-lift active:scale-[0.98]"
          >
            Masuk ke Aplikasi
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${220 + i * 80}ms` }}
            >
              <p className="text-sm font-semibold text-slate-800">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
