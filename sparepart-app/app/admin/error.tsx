"use client";

// Error boundary segmen admin: retry tanpa reload penuh agar koneksi pool
// yang sempat habis (P2024) bisa dipakai ulang pada percobaan berikutnya.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isPool = /connection pool|timed out fetching/i.test(error?.message ?? "");
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200/70 bg-white/90 p-8 text-center shadow-soft">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        Gagal memuat halaman admin
      </h1>
      <p className="text-sm leading-relaxed text-slate-500">
        {isPool
          ? "Koneksi database sedang sibuk karena banyak permintaan bersamaan. Tunggu sebentar lalu coba lagi."
          : "Terjadi kesalahan saat mengambil data. Silakan coba lagi."}
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98]"
      >
        Coba lagi
      </button>
    </div>
  );
}
