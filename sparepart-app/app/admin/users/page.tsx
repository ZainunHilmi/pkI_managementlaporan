import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/prisma";
import UserManager from "@/components/UserManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const users = await withDbRetry(() =>
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
      orderBy: { createdAt: "desc" },
    })
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manajemen Pengguna"
        description={`${users.length} akun terdaftar. Akun nonaktif tidak bisa masuk.`}
      />
      <UserManager items={users} selfId={session!.user.id} />
    </div>
  );
}
