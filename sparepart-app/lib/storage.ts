// Penyimpanan gambar: ImageKit.io (pengganti ImgBB — host i.ibb.co
// diblokir di jaringan Indonesia sehingga file tak bisa dilihat).
// Upload server-side via REST API dengan private key, mengembalikan
// URL CDN publik. Validasi file tetap di lib/imgbb.ts (imageFileSchema)
// dan dipakai route sebelum memanggil uploadImage.
// Tanda fungsi disamakan dengan uploader lama agar route tak perlu diubah.
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function storageConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "");
  const folder = process.env.IMAGEKIT_FOLDER?.trim() || "sparepart";
  if (!privateKey || !urlEndpoint) {
    throw new Error("IMAGEKIT_PRIVATE_KEY / IMAGEKIT_URL_ENDPOINT belum dikonfigurasi");
  }
  return { privateKey, urlEndpoint, folder };
}

export async function uploadImage(file: File): Promise<string> {
  const { privateKey, folder } = storageConfig();

  const ext = MIME_EXT[file.type] ?? "jpg";
  const form = new FormData();
  form.append("file", file, `upload.${ext}`);
  form.append("fileName", `${Date.now()}.${ext}`);
  form.append("folder", `/${folder}`);
  form.append("useUniqueFileName", "true");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    // Auth: private key sebagai username, password kosong (dok ImageKit).
    headers: { Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || typeof data?.url !== "string") {
    throw new Error("Gagal mengunggah ke ImageKit");
  }
  return data.url as string;
}
