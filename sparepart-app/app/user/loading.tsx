// Skeleton segmen user: umpan balik visual saat query masih berjalan.
export default function UserLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat halaman">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft"
          />
        ))}
      </div>
    </div>
  );
}
