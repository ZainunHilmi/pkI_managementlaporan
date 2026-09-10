import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

// FR-USG-01: POST /api/sparepart/[id]/pakai — hanya USER.
// Kurangi stok secara atomik lalu catat StockHistory KELUAR.
const pakaiSchema = z.object({
  jumlah: z.coerce.number().int().min(1, "Jumlah minimal 1"),
  keterangan: z.string().max(500, "Keterangan maksimal 500 karakter").default(""),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(["USER"]);
  if (error || !session) return error;

  try {
    const parsed = pakaiSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }
    const { jumlah, keterangan } = parsed.data;

    // Decrement atomik: hanya berhasil jika stok mencukupi.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.sparepart.updateMany({
        where: { id: params.id, jumlahStock: { gte: jumlah } },
        data: { jumlahStock: { decrement: jumlah } },
      });
      if (updated.count === 0) return null;

      await tx.stockHistory.create({
        data: {
          sparepartId: params.id,
          userId: session.user.id,
          type: "KELUAR",
          jumlah,
          keterangan: keterangan || null,
        },
      });
      const current = await tx.sparepart.findUnique({
        where: { id: params.id },
        select: { jumlahStock: true },
      });
      return current!.jumlahStock;
    });

    if (result === null) {
      const exists = await prisma.sparepart.findUnique({
        where: { id: params.id },
        select: { id: true },
      });
      return NextResponse.json(
        { error: exists ? "Stok tidak mencukupi" : "Sparepart tidak ditemukan" },
        { status: exists ? 400 : 404 }
      );
    }

    return NextResponse.json({ success: true, sisaStok: result });
  } catch (e) {
    console.error("[POST /api/sparepart/:id/pakai]", e);
    return NextResponse.json(
      { error: "Gagal mencatat penggunaan" },
      { status: 500 }
    );
  }
}
