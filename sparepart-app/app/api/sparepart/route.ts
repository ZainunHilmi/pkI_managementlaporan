import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  MAX_IMAGE_COUNT,
  imageFileSchema,
} from "@/lib/imgbb";
import { uploadImage } from "@/lib/storage";

// FR-SP-01: GET /api/sparepart — semua role yang login, dengan
// filter ?search=&lokasi= dan pagination ?page=&limit=
export async function GET(request: Request) {
  try {
    const { error } = await requireRole(["ADMIN", "USER"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || undefined;
    const lokasi = searchParams.get("lokasi")?.trim() || undefined;
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
    );

    const where = {
      ...(search
        ? { nama: { contains: search, mode: "insensitive" as const } }
        : {}),
      ...(lokasi
        ? { lokasi: { contains: lokasi, mode: "insensitive" as const } }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.sparepart.count({ where }),
      prisma.sparepart.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({ data, total, page });
  } catch (error) {
    console.error("[GET /api/sparepart]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data sparepart" },
      { status: 500 }
    );
  }
}

// FR-SP-02: POST /api/sparepart — hanya ADMIN, multipart/form-data.
const createSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  jumlahStock: z.coerce.number().int().min(0, "Stok minimal 0"),
  lokasi: z.string().min(1, "Lokasi wajib diisi").max(200, "Lokasi maksimal 200 karakter"),
  deskripsi: z
    .string()
    .min(1, "Deskripsi wajib diisi")
    .max(1000, "Deskripsi maksimal 1000 karakter"),
  threshold: z.coerce.number().int().min(0).default(5),
});

export async function POST(request: Request) {
  try {
    const { session, error } = await requireRole(["ADMIN"]);
    if (error || !session) return error;

    const formData = await request.formData();
    const parsed = createSchema.safeParse({
      nama: formData.get("nama"),
      jumlahStock: formData.get("jumlahStock"),
      lokasi: formData.get("lokasi"),
      deskripsi: formData.get("deskripsi"),
      threshold: formData.get("threshold") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    // Gambar: maksimal 2 file, masing-masing divalidasi tipe + ukuran.
    const files = formData
      .getAll("gambar")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_IMAGE_COUNT) {
      return NextResponse.json(
        { error: "Maksimal 2 gambar" },
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

    // Upload ke Supabase Storage dulu, baru simpan URL + catat stok awal (MASUK).
    const urls = await Promise.all(files.map(uploadImage));
    const sparepart = await prisma.$transaction(async (tx) => {
      const created = await tx.sparepart.create({
        data: {
          ...parsed.data,
          gambar: urls,
          createdById: session.user.id,
        },
      });
      await tx.stockHistory.create({
        data: {
          sparepartId: created.id,
          userId: session.user.id,
          type: "MASUK",
          jumlah: created.jumlahStock,
          keterangan: "Stok awal",
        },
      });
      return created;
    });

    return NextResponse.json(
      { success: true, data: sparepart },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/sparepart]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && /supabase|imgbb|unggah/i.test(error.message)
            ? error.message
            : "Gagal menambah sparepart",
      },
      { status: 500 }
    );
  }
}
