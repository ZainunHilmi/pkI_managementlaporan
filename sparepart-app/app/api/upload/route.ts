import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { imageFileSchema } from "@/lib/imgbb";
import { uploadImage } from "@/lib/storage";

// Langkah 6 SRS §9 + FR-UP-01: POST /api/upload — teruskan file ke ImageKit.
export async function POST(request: Request) {
  try {
    // Hanya ADMIN
    const { error } = await requireRole(["ADMIN"]);
    if (error) return error;

    const formData = await request.formData();
    const parsed = imageFileSchema.safeParse(formData.get("file"));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "File tidak valid" },
        { status: 400 }
      );
    }

    const url = await uploadImage(parsed.data);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    const message =
      error instanceof Error && /belum dikonfigurasi/i.test(error.message)
        ? error.message
        : "Gagal mengunggah gambar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
