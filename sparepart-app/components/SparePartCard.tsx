import Link from "next/link";
import StockBadge from "@/components/StockBadge";
import ZoomableThumb from "@/components/ZoomableThumb";

// Kartu sparepart untuk dashboard user (SRS §7: SparePartCard).
export default function SparePartCard({
  id,
  nama,
  lokasi,
  jumlahStock,
  threshold,
  gambar,
  delay = "0ms",
}: {
  id: string;
  nama: string;
  lokasi: string;
  jumlahStock: number;
  threshold: number;
  gambar: string[];
  delay?: string;
}) {
  return (
    <Link
      href={`/user/sparepart/${id}`}
      className="group animate-fade-up overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      style={{ animationDelay: delay }}
    >
      <ZoomableThumb
        images={gambar}
        alt={nama}
        boxClassName="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50"
        imgClassName="object-cover"
        sizes="(max-width: 640px) 100vw, 33vw"
      />
      <div className="space-y-1.5 p-4">
        <p className="font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-teal-700">{nama}</p>
        <p className="text-sm text-slate-400">{lokasi}</p>
        <StockBadge jumlahStock={jumlahStock} threshold={threshold} />
      </div>
    </Link>
  );
}
