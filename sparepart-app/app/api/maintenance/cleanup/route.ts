import { NextResponse } from "next/server";
import { prisma, withDbRetry } from "@/lib/prisma";
import {
  CLEANUP_BATCH_SIZE,
  CLEANUP_MAX_BATCHES,
  RETENTION_MONTHS,
  cutoffLabel,
  getCleanupCutoff,
} from "@/lib/maintenance";
import { requireRole } from "@/lib/api-auth";

// Pemeliharaan database tier gratis: riwayat stok (stock_history) hanya
// disimpan 3 bulan terakhir. Data master sparepart & user TIDAK dihapus.
// Alur wajib: Export CSV dulu dari halaman laporan sebagai arsip,
// baru hapus via tombol manual (endpoint ini).
//
//  - GET  → preview: cutoff + jumlah baris yang akan dihapus (tanpa hapus)
//  - POST { confirm: true } → hapus bertahap per batch agar pool koneksi
//    tidak jebol (pelajaran kasus P2024), maks 100 batch per eksekusi.

export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const cutoff = getCleanupCutoff();
    const count = await withDbRetry(() =>
      prisma.stockHistory.count({ where: { createdAt: { lt: cutoff } } })
    );
    return NextResponse.json({
      cutoff: cutoff.toISOString(),
      cutoffLabel: cutoffLabel(cutoff),
      count,
      retentionMonths: RETENTION_MONTHS,
    });
  } catch (e) {
    console.error("[GET /api/maintenance/cleanup]", e);
    return NextResponse.json({ error: "Gagal menghitung data lama" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (typeof body !== "object" || body === null || (body as { confirm?: unknown }).confirm !== true) {
    return NextResponse.json(
      { error: "Butuh konfirmasi eksplisit { confirm: true }" },
      { status: 400 }
    );
  }

  try {
    const cutoff = getCleanupCutoff();
    let deleted = 0;
    for (let i = 0; i < CLEANUP_MAX_BATCHES; i++) {
      const batch = await withDbRetry(() =>
        prisma.stockHistory.findMany({
          where: { createdAt: { lt: cutoff } },
          select: { id: true },
          orderBy: { createdAt: "asc" },
          take: CLEANUP_BATCH_SIZE,
        })
      );
      if (batch.length === 0) break;
      const res = await withDbRetry(() =>
        prisma.stockHistory.deleteMany({ where: { id: { in: batch.map((r) => r.id) } } })
      );
      deleted += res.count;
      if (batch.length < CLEANUP_BATCH_SIZE) break;
    }
    return NextResponse.json({ deleted, cutoffLabel: cutoffLabel(cutoff) });
  } catch (e) {
    console.error("[POST /api/maintenance/cleanup]", e);
    return NextResponse.json({ error: "Gagal menghapus data lama" }, { status: 500 });
  }
}
