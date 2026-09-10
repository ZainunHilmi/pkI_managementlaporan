"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";

// Form catat penggunaan stok (SRS §7: UsageForm, FR-USG-01).
export default function UsageForm({
  sparepartId,
  stokSaatIni,
}: {
  sparepartId: string;
  stokSaatIni: number;
}) {
  const router = useRouter();
  const [jumlah, setJumlah] = useState(1);
  const [keterangan, setKeterangan] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sparepart/${sparepartId}/pakai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumlah, keterangan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "Gagal mencatat penggunaan" });
        return;
      }
      setMessage({ type: "success", text: `Tercatat. Sisa stok: ${data.sisaStok}` });
      setJumlah(1);
      setKeterangan("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <Alert tone={message.type}>{message.text}</Alert>}
      <Field label={`Jumlah dipakai (stok tersedia: ${stokSaatIni})`} htmlFor="jumlah">
        <Input
          id="jumlah"
          type="number"
          min={1}
          max={stokSaatIni}
          step={1}
          value={jumlah}
          onChange={(e) => setJumlah(Number(e.target.value))}
          required
          tone="teal"
        />
      </Field>
      <Field label="Keterangan" htmlFor="keterangan">
        <Input
          id="keterangan"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          maxLength={500}
          placeholder="Untuk keperluan apa..."
          tone="teal"
        />
      </Field>
      <Button type="submit" tone="teal" loading={loading} disabled={stokSaatIni === 0} className="w-full">
        {loading ? "Mencatat..." : "Catat Penggunaan"}
      </Button>
    </form>
  );
}
