import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, TableWrap, Td, Th } from "@/components/ui";

export const dynamic = "force-dynamic";

// Riwayat aktivitas akun sendiri (SRS §4.3).
export default async function UserRiwayatPage() {
  const session = await getServerSession(authOptions);
  const history = await withDbRetry(() =>
    prisma.stockHistory.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { sparepart: { select: { nama: true } } },
    })
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat Aktivitas Saya"
        description="50 pencatatan terakhir oleh akun ini."
      />
      <Card className="animate-fade-up overflow-hidden p-2" >
        {history.length === 0 ? (
          <EmptyState title="Belum ada aktivitas tercatat" hint="Pemakaian yang Anda catat akan muncul di sini." />
        ) : (
          <TableWrap>
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Waktu</Th>
                  <Th>Sparepart</Th>
                  <Th>Tipe</Th>
                  <Th className="text-right">Jumlah</Th>
                  <Th>Keterangan</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                    <Td className="whitespace-nowrap text-slate-400">
                      {h.createdAt.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </Td>
                    <Td className="font-medium text-slate-900">{h.sparepart.nama}</Td>
                    <Td>
                      <Badge tone={h.type === "MASUK" ? "emerald" : "rose"}>{h.type}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{h.jumlah}</Td>
                    <Td className="max-w-52 truncate text-slate-500"><span title={h.keterangan ?? ""}>{h.keterangan ?? "–"}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
