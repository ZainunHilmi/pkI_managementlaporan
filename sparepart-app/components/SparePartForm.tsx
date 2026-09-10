"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Alert, Button, ButtonLink, Field, Input, Textarea } from "@/components/ui";

export type SparepartInitial = {
  nama: string;
  jumlahStock: number;
  lokasi: string;
  deskripsi: string;
  threshold: number;
  gambar: string[];
};

// Form tambah/edit sparepart (SRS §7: SparePartForm).
// Kompres gambar di sisi client (target < 400 KB, SRS §6.2) sebelum dikirim.
export default function SparePartForm({
  id,
  initial,
}: {
  id?: string;
  initial?: SparepartInitial;
}) {
  const router = useRouter();
  const isEdit = !!id;

  const [nama, setNama] = useState(initial?.nama ?? "");
  const [jumlahStock, setJumlahStock] = useState(initial?.jumlahStock ?? 0);
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi ?? "");
  const [threshold, setThreshold] = useState(initial?.threshold ?? 5);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const list = Array.from(selected).slice(0, 2);
    setCompressing(true);
    try {
      const compressed = await Promise.all(
        list.map((f) =>
          imageCompression(f, {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
          })
        )
      );
      setFiles(compressed);
      setPreviews(compressed.map((f) => URL.createObjectURL(f)));
    } catch {
      setError("Gagal mengompresi gambar");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nama.trim() || !lokasi.trim() || !deskripsi.trim()) {
      setError("Nama, lokasi, dan deskripsi wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nama", nama.trim());
      formData.append("jumlahStock", String(jumlahStock));
      formData.append("lokasi", lokasi.trim());
      formData.append("deskripsi", deskripsi.trim());
      formData.append("threshold", String(threshold));
      for (const f of files) formData.append("gambar", f);

      const res = await fetch(isEdit ? `/api/sparepart/${id}` : "/api/sparepart", {
        method: isEdit ? "PUT" : "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Gagal menyimpan data");
        return;
      }
      router.push("/admin/sparepart");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  const gallery = previews.length > 0 ? previews : (initial?.gambar ?? []);

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
      <div className="space-y-4 md:col-span-2">{error && <Alert tone="error">{error}</Alert>}</div>
      <div className="md:col-span-2">
        <Field label="Nama sparepart" htmlFor="nama">
          <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={100} required placeholder="cth. Oli Mesin 10W-40" />
        </Field>
      </div>
      <Field label="Jumlah stok" htmlFor="stok">
        <Input id="stok" type="number" min={0} step={1} value={jumlahStock} onChange={(e) => setJumlahStock(Number(e.target.value))} required />
      </Field>
      <Field label="Batas minimum" htmlFor="threshold" hint="Peringatan muncul saat stok di bawah angka ini">
        <Input id="threshold" type="number" min={0} step={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Lokasi penyimpanan" htmlFor="lokasi">
          <Input id="lokasi" value={lokasi} onChange={(e) => setLokasi(e.target.value)} maxLength={200} required placeholder="cth. Rak A-12" />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Deskripsi" htmlFor="deskripsi">
          <Textarea id="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} maxLength={1000} required rows={4} placeholder="Keterangan detail item..." />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field
          label="Foto item"
          htmlFor="gambar"
          hint={`Maks 2 file JPG/PNG/WEBP, dikompresi otomatis < 400 KB${isEdit ? " · kosongkan untuk mempertahankan foto lama" : ""}`}
        >
          <label
            htmlFor="gambar"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
            <span className="text-sm font-medium text-slate-600">
              {compressing ? "Mengompresi..." : files.length > 0 ? `${files.length} file dipilih` : "Klik untuk memilih foto"}
            </span>
            <input id="gambar" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleFiles(e.target.files)} className="sr-only" />
          </label>
          {gallery.length > 0 && (
            <div className="mt-3 flex gap-2">
              {gallery.map((src) =>
                src.startsWith("blob:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="Pratinjau" className="h-20 w-20 rounded-xl border border-slate-200 object-cover shadow-sm" />
                ) : (
                  <Image key={src} src={src} alt="Foto tersimpan" width={80} height={80} className="h-20 w-20 rounded-xl border border-slate-200 object-cover shadow-sm" />
                )
              )}
            </div>
          )}
        </Field>
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" loading={loading}>
          {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Sparepart"}
        </Button>
        <ButtonLink href="/admin/sparepart" variant="secondary">
          Batal
        </ButtonLink>
      </div>
    </form>
  );
}
