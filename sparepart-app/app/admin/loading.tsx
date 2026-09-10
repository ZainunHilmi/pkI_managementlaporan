// Skeleton segmen admin: menahan klik berulang saat query masih berjalan,
// yang sebelumnya memperparah kehabisan koneksi pool.
export default function AdminLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat halaman admin">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft"
          />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-soft">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
