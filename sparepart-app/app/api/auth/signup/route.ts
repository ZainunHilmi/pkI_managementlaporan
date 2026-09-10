import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma, withDbRetry } from "@/lib/prisma";

// POST /api/auth/signup — PUBLIK (tanpa login).
// Pendaftaran mandiri akun teknisi. Role selalu dipaksa USER di server
// (tidak diambil dari input) agar tidak ada yang bisa mendaftar sebagai ADMIN.
const signupSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().trim().email("Format email tidak valid").max(255),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
});

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Input tidak valid" },
        { status: 400 }
      );
    }

    const exists = await withDbRetry(() =>
      prisma.user.findUnique({ where: { email: parsed.data.email } })
    );
    if (exists) {
      return NextResponse.json({ error: "Email sudah terdaftar, silakan masuk" }, { status: 409 });
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await withDbRetry(() =>
      prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: passwordHash,
          role: "USER",
        },
        select: { id: true, name: true, email: true, role: true },
      })
    );
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/auth/signup]", e);
    return NextResponse.json({ error: "Gagal mendaftar, coba lagi" }, { status: 500 });
  }
}
