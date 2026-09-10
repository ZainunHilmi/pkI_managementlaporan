import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

// PUT /api/users/[id] — hanya ADMIN: ubah nama/role/status, opsional password.
const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, "Password minimal 8 karakter").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Tidak ada field yang diubah",
  });

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(["ADMIN"]);
  if (error || !session) return error;

  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    // Admin tidak boleh menonaktifkan akunnya sendiri.
    const parsed = updateUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }
    if (params.id === session.user.id && parsed.data.isActive === false) {
      return NextResponse.json(
        { error: "Tidak dapat menonaktifkan akun sendiri" },
        { status: 400 }
      );
    }

    const { password, ...rest } = parsed.data;
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(password ? { password: await hash(password, 12) } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    console.error("[PUT /api/users/:id]", e);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}
