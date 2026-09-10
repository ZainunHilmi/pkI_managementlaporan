import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/sparepart", label: "Sparepart" },
  { href: "/admin/users", label: "Pengguna" },
  { href: "/admin/laporan", label: "Laporan" },
];

// Layout panel admin: cek role ADMIN, redirect jika bukan (SRS §5.6).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <AppShell
      title="Sparepart · Admin"
      email={session.user.email ?? ""}
      nav={NAV}
      tone="indigo"
    >
      <div className="zoom-admin">{children}</div>
    </AppShell>
  );
}
