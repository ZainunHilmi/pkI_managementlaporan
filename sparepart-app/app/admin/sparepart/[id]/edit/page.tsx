import { notFound } from "next/navigation";
import { prisma, withDbRetry } from "@/lib/prisma";
import SparePartForm from "@/components/SparePartForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditSparepartPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await withDbRetry(() =>
    prisma.sparepart.findUnique({ where: { id: params.id } })
  );
  if (!item) notFound();

  return (
    <div className="space-y-5">
      <PageHeader title="Edit Sparepart" description={item.nama} />
      <Card className="animate-fade-up p-5 sm:p-7" >
        <SparePartForm
          id={item.id}
          initial={{
            nama: item.nama,
            jumlahStock: item.jumlahStock,
            lokasi: item.lokasi,
            deskripsi: item.deskripsi,
            threshold: item.threshold,
            gambar: item.gambar,
          }}
        />
      </Card>
    </div>
  );
}
