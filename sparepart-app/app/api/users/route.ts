import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

// GET /api/users — hanya ADMIN.
export async function GET() {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: users });
  } catch (e) {
    console.error("[GET /api/users]", e);
    return NextResponse.json({ error: "Gagal mengambil data pengguna" }, { status: 500 });
  }
}

const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

// POST /api/users — hanya ADMIN.
export async function POST(request: Request) {
  const { error } = await requireRole(["ADMIN"]);
  if (error) return error;

  try {
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: await hash(parsed.data.password, 12),
        role: parsed.data.role,
      },
      select: userSelect,
    });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json({ error: "Gagal menambah pengguna" }, { status: 500 });
  }
}
