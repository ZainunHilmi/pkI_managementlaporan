import { notFound } from "next/navigation";
import { prisma, withDbRetry } from "@/lib/prisma";
import ImageGallery from "@/components/ImageGallery";
import StockBadge from "@/components/StockBadge";
import UsageForm from "@/components/UsageForm";
import { Card } from "@/components/ui";

// Detail sparepart + form catat penggunaan (SRS §2.2, §4.3).
export default async function UserSparepartDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await withDbRetry(() =>
    prisma.sparepart.findUnique({
      where: { id: params.id },
    })
  );
  if (!item) notFound();

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-5">
      <Card className="animate-fade-up overflow-hidden p-3 lg:col-span-3" >
        <ImageGallery images={item.gambar} alt={item.nama} />
      </Card>
      <div className="space-y-5 lg:col-span-2">
        <Card className="animate-fade-up p-5" >
          <p className="text-xs font-medium uppercase tracking-wide text-teal-600">{item.lokasi}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{item.nama}</h1>
          <div className="mt-3">
            <StockBadge jumlahStock={item.jumlahStock} threshold={item.threshold} />
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.deskripsi}</p>
        </Card>
        <Card className="animate-fade-up border-teal-100 p-5" >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Catat Penggunaan
          </h2>
          <UsageForm sparepartId={item.id} stokSaatIni={item.jumlahStock} />
        </Card>
      </div>
    </div>
  );
}
