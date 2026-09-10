import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  MAX_IMAGE_COUNT,
  imageFileSchema,
} from "@/lib/imgbb";
import { uploadImage } from "@/lib/storage";

type Params = { params: { id: string } };

// GET /api/sparepart/[id] — semua role yang login.
export async function GET(_request: Request, { params }: Params) {
  try {
    const { error } = await requireRole(["ADMIN", "USER"]);
    if (error) return error;

    const sparepart = await prisma.sparepart.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!sparepart) {
      return NextResponse.json(
        { error: "Sparepart tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: sparepart });
  } catch (error) {
    console.error("[GET /api/sparepart/:id]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data sparepart" },
      { status: 500 }
    );
  }
}

// FR-SP-03: PUT /api/sparepart/[id] — hanya ADMIN, partial update
// (multipart/form-data). File `gambar` baru (maks 2) menimpa URL lama,
// perubahan jumlahStock dicatat di StockHistory.
const updateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  jumlahStock: z.coerce.number().int().min(0).optional(),
  lokasi: z.string().min(1).max(200).optional(),
  deskripsi: z.string().min(1).max(1000).optional(),
  threshold: z.coerce.number().int().min(0).optional(),
});

export async function PUT(request: Request, { params }: Params) {
  try {
    const { session, error } = await requireRole(["ADMIN"]);
    if (error || !session) return error;

    const existing = await prisma.sparepart.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Sparepart tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const pick = (key: string) => {
      const v = formData.get(key);
      return v === null || v === "" ? undefined : v;
    };
    const parsed = updateSchema.safeParse({
      nama: pick("nama"),
      jumlahStock: pick("jumlahStock"),
      lokasi: pick("lokasi"),
      deskripsi: pick("deskripsi"),
      threshold: pick("threshold"),
    });

    const files = formData
      .getAll("gambar")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_IMAGE_COUNT) {
      return NextResponse.json(
        { error: "Maksimal 2 gambar" },
        { status: 400 }
      );
    }

    // Tidak ada field teks dan tidak ada gambar baru → 400.
    // (Update khusus gambar saja tetap diizinkan.)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }
    if (Object.keys(parsed.data).length === 0 && files.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field yang diubah" },
        { status: 400 }
      );
    }

    for (const file of files) {
      const check = imageFileSchema.safeParse(file);
      if (!check.success) {
        return NextResponse.json(
          { error: check.error.issues[0]?.message ?? "Gambar tidak valid" },
          { status: 400 }
        );
      }
    }

    // Gambar lama dibiarkan orphan di storage (keterbatasan, SRS §7).
    const urls = files.length > 0 ? await Promise.all(files.map(uploadImage)) : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.sparepart.update({
        where: { id: params.id },
        data: {
          ...parsed.data,
          ...(urls ? { gambar: urls } : {}),
        },
      });

      // Catat selisih stok: tambah → MASUK, kurang → KELUAR.
      if (
        parsed.data.jumlahStock !== undefined &&
        parsed.data.jumlahStock !== existing.jumlahStock
      ) {
        const delta = parsed.data.jumlahStock - existing.jumlahStock;
        await tx.stockHistory.create({
          data: {
            sparepartId: params.id,
            userId: session.user.id,
            type: delta > 0 ? "MASUK" : "KELUAR",
            jumlah: Math.abs(delta),
            keterangan: "Penyesuaian stok oleh admin",
          },
        });
      }
      return result;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PUT /api/sparepart/:id]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && /supabase|imgbb|unggah/i.test(error.message)
            ? error.message
            : "Gagal memperbarui sparepart",
      },
      { status: 500 }
    );
  }
}

// FR-SP-04: DELETE /api/sparepart/[id] — hanya ADMIN.
// StockHistory ikut terhapus via onDelete Cascade; gambar orphan di ImgBB.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { error } = await requireRole(["ADMIN"]);
    if (error) return error;

    const existing = await prisma.sparepart.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Sparepart tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.sparepart.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/sparepart/:id]", error);
    return NextResponse.json(
      { error: "Gagal menghapus sparepart" },
      { status: 500 }
    );
  }
}
