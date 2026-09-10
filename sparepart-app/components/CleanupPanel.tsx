"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";

type Preview = {
  cutoff: string;
  cutoffLabel: string;
  count: number;
  retentionMonths: number;
};

// Panel manual bersih-bersih database: tampilkan berapa baris riwayat
// lama yang akan dihapus, minta konfirmasi tegas, lalu hapus via API.
// Dipasang di halaman laporan — tepat di bawah form Export CSV —
// agar alurnya benar: ARSIP dulu, baru HAPUS.
export default function CleanupPanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/maintenance/cleanup", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Gagal memuat info data lama");
      setPreview(j as Preview);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat info data lama");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async () => {
    if (!preview || preview.count === 0 || busy) return;
    const ok = window.confirm(
      `Hapus ${preview.count} baris riwayat lebih tua dari ${preview.cutoffLabel}?\n\nPastikan kamu sudah EXPORT CSV dulu sebagai arsip. Tindakan ini TIDAK bisa dibatalkan.`
    );
    if (!ok) return;
    setBusy(true);
    setResult(null);
    setErr(null);
    try {
      const r = await fetch("/api/maintenance/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Gagal menghapus data lama");
      setResult(`Berhasil menghapus ${j.deleted} baris riwayat lama.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menghapus data lama");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="animate-fade-up border-rose-100 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Bersihkan data lama
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Riwayat stok hanya disimpan {preview?.retentionMonths ?? 3} bulan terakhir untuk
        menghemat storage tier gratis. Data sparepart & pengguna tidak ikut terhapus.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-slate-500">Menghitung data lama…</p>
      ) : err ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-rose-600">{err}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Coba lagi
          </Button>
        </div>
      ) : preview ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-700">
            {preview.count === 0 ? (
              <>Tidak ada data lebih tua dari <strong>{preview.cutoffLabel}</strong>. Database sudah ramping.</>
            ) : (
              <><strong className="tabular-nums">{preview.count}</strong> baris riwayat lebih tua dari <strong>{preview.cutoffLabel}</strong> siap dihapus.</>
            )}
          </p>
          {preview.count > 0 && (
            <Button type="button" variant="danger-soft" loading={busy} onClick={() => void run()}>
              {busy ? "Menghapus…" : "Hapus data lama"}
            </Button>
          )}
        </div>
      ) : null}
      {result && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{result}</p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Wajib Export CSV dulu dari form di atas sebagai arsip sebelum menghapus.
      </p>
    </Card>
  );
}
