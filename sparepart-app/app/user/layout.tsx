import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const NAV = [
  { href: "/user/dashboard", label: "Dashboard" },
  { href: "/user/riwayat", label: "Riwayat Saya" },
];

// Layout panel user: cek role USER, redirect jika bukan (SRS §5.6).
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "USER") {
    redirect("/unauthorized");
  }

  return (
    <AppShell
      title="Sparepart · Teknisi"
      email={session.user.email ?? ""}
      nav={NAV}
      tone="teal"
    >
      <div className="zoom-user">{children}</div>
    </AppShell>
  );
}
