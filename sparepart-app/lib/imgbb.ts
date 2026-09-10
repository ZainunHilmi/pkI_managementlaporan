import { z } from "zod";

// Batasan upload gambar (SRS FR-SP-02 / FR-UP-01).
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_COUNT = 2;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageFileSchema = z
  .instanceof(File, { message: "File tidak valid" })
  .refine((f) => f.size > 0, { message: "File kosong" })
  .refine((f) => f.size <= MAX_IMAGE_SIZE, {
    message: "Ukuran file maksimal 5 MB",
  })
  .refine((f) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type), {
    message: "Format harus JPG, PNG, atau WEBP",
  });

// Upload satu file ke ImgBB, kembalikan URL publik (SRS §5.3).
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY belum dikonfigurasi");

  const imgbbFormData = new FormData();
  imgbbFormData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: imgbbFormData,
  });
  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error("Gagal mengunggah ke ImgBB");
  }
  return data.data.url as string;
}
