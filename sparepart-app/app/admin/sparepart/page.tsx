import { prisma, withDbRetry } from "@/lib/prisma";
import SparePartTable from "@/components/SparePartTable";
import { Button, ButtonLink, Card, Input, PageHeader } from "@/components/ui";

// Selalu render fresh (ikuti ?search=), jangan cache antar navigasi.
export const dynamic = "force-dynamic";

// Daftar semua sparepart (SRS §2.2).
export default async function AdminSparepartPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams.search?.trim();
  // withDbRetry: navigasi cepat antar halaman memicu banyak query bersamaan
  // dan bisa kena P2024 (pool timeout) — coba ulang otomatis sebelum error.
  // take: 200 agar satu query tidak menahan koneksi terlalu lama.
  const items = await withDbRetry(() =>
    prisma.sparepart.findMany({
      where: search
        ? { nama: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        nama: true,
        jumlahStock: true,
        lokasi: true,
        threshold: true,
        gambar: true,
        updatedAt: true,
      },
    })
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Sparepart"
        description={`${items.length} item tercatat.`}
        actions={<ButtonLink href="/admin/sparepart/tambah">+ Tambah</ButtonLink>}
      />
      <Card className="animate-fade-up p-4" >
        <form method="get" className="flex gap-2">
          <Input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Cari nama sparepart..."
            className="max-w-xs"
          />
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>
      </Card>
      <Card className="animate-fade-up overflow-hidden p-2" >
        <div className="p-2">
          <SparePartTable
            items={items.map((i) => ({ ...i, updatedAt: i.updatedAt.toISOString() }))}
          />
        </div>
      </Card>
    </div>
  );
}
