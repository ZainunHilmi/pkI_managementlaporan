// Skeleton global: ditampilkan Next.js saat Server Component sedang fetch,
// sehingga navigasi cepat tidak terlihat macet / diklik berulang-ulang.
export default function RootLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat data">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-soft">
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-soft">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
