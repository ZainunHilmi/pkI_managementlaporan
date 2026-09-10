"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StockBadge from "@/components/StockBadge";
import ZoomableThumb from "@/components/ZoomableThumb";
import { Alert, EmptyState, TableWrap, Td, Th } from "@/components/ui";

export type SparepartRow = {
  id: string;
  nama: string;
  jumlahStock: number;
  lokasi: string;
  threshold: number;
  gambar: string[];
  updatedAt: string;
};

// Tabel sparepart admin dengan aksi edit/hapus (SRS §7: SparePartTable).
export default function SparePartTable({ items }: { items: SparepartRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(item: SparepartRow) {
    if (!confirm(`Hapus "${item.nama}"?`)) return;
    setDeleting(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/sparepart/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Gagal menghapus");
        return;
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return <EmptyState title="Belum ada data sparepart" hint="Klik Tambah untuk mencatat item pertama." />;
  }

  return (
    <div>
      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <TableWrap>
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <Th>Item</Th>
              <Th>Lokasi</Th>
              <Th>Stok</Th>
              <Th>Diperbarui</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                <Td>
                  <span className="flex items-center gap-3">
                    {item.gambar[0] ? (
                      <ZoomableThumb
                        images={item.gambar}
                        alt={item.nama}
                        boxClassName="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200"
                        imgClassName="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">
                        —
                      </span>
                    )}
                    <span className="font-medium text-slate-900">{item.nama}</span>
                  </span>
                </Td>
                <Td className="text-slate-500">{item.lokasi}</Td>
                <Td>
                  <StockBadge jumlahStock={item.jumlahStock} threshold={item.threshold} />
                </Td>
                <Td className="whitespace-nowrap text-slate-400">
                  {new Date(item.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </Td>
                <Td className="text-right">
                  <span className="inline-flex gap-1.5 opacity-100 transition group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                    <Link
                      href={`/admin/sparepart/${item.id}/edit`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deleting === item.id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      {deleting === item.id ? "…" : "Hapus"}
                    </button>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
