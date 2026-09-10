import { prisma, withDbRetry } from "@/lib/prisma";
import SparePartCard from "@/components/SparePartCard";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

// Dashboard user: daftar sparepart + pencarian + filter lokasi (SRS §4.3).
export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: { search?: string; lokasi?: string };
}) {
  const search = searchParams.search?.trim() || undefined;
  const lokasi = searchParams.lokasi?.trim() || undefined;

  const [items, lokasiList] = await withDbRetry(() =>
    Promise.all([
      prisma.sparepart.findMany({
        where: {
          ...(search ? { nama: { contains: search, mode: "insensitive" as const } } : {}),
          ...(lokasi ? { lokasi } : {}),
        },
        orderBy: { nama: "asc" },
        take: 200,
        select: {
          id: true,
          nama: true,
          lokasi: true,
          jumlahStock: true,
          threshold: true,
          gambar: true,
        },
      }),
      prisma.sparepart.findMany({
        select: { lokasi: true },
        distinct: ["lokasi"],
        orderBy: { lokasi: "asc" },
      }),
    ])
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ketersediaan Sparepart"
        description={items.length > 0 ? `${items.length} item ditemukan. Klik kartu untuk detail & catat pemakaian.` : undefined}
      />
      <Card className="animate-fade-up p-4" >
        <form method="get" className="flex flex-wrap gap-2">
          <Input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Cari nama sparepart..."
            className="max-w-xs flex-1"
          />
          <Select name="lokasi" defaultValue={lokasi ?? ""} tone="teal" className="w-auto">
            <option value="">Semua lokasi</option>
            {lokasiList.map((l) => (
              <option key={l.lokasi} value={l.lokasi}>{l.lokasi}</option>
            ))}
          </Select>
          <Button type="submit" tone="teal" variant="secondary">
            Cari
          </Button>
        </form>
      </Card>
      {items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState title="Tidak ada sparepart yang cocok" hint="Coba kata kunci atau lokasi lain." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <SparePartCard key={item.id} {...item} delay={`${Math.min(i, 8) * 60}ms`} />
          ))}
        </div>
      )}
    </div>
  );
}
