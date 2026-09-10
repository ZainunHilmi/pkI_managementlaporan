"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Badge, Button, Card, Field, Input, Select, TableWrap, Td, Th } from "@/components/ui";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
};

// Kelola pengguna: tambah akun + aktif/nonaktif (SRS §4.2).
export default function UserManager({ items, selfId }: { items: UserRow[]; selfId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function callApi(url: string, method: string, body?: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Gagal");
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await callApi("/api/users", "POST", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(user: UserRow) {
    setError(null);
    try {
      await callApi(`/api/users/${user.id}`, "PUT", { isActive: !user.isActive });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui pengguna");
    }
  }

  return (
    <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <Card className="animate-fade-up p-5" >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Tambah Pengguna
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama" htmlFor="um-name">
            <Input id="um-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required maxLength={100} />
          </Field>
          <Field label="Email" htmlFor="um-email">
            <Input id="um-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@contoh.com" type="email" required />
          </Field>
          <Field label="Password" htmlFor="um-password" hint="Minimal 8 karakter">
            <Input id="um-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" required minLength={8} />
          </Field>
          <Field label="Role" htmlFor="um-role">
            <Select id="um-role" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}>
              <option value="USER">USER — Teknisi</option>
              <option value="ADMIN">ADMIN — Pengelola</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={loading}>
              {loading ? "Menyimpan..." : "Tambah Pengguna"}
            </Button>
          </div>
        </form>
      </Card>
      <Card className="animate-fade-up overflow-hidden p-2" >
        <TableWrap>
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <Th>Pengguna</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <Td>
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <span className="block font-medium text-slate-900">{u.name}</span>
                        <span className="block text-xs text-slate-400">{u.email}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={u.role === "ADMIN" ? "indigo" : "slate"}>{u.role}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? "emerald" : "rose"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </Td>
                  <Td className="text-right">
                    {u.id !== selfId ? (
                      <button
                        onClick={() => handleToggle(u)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                      >
                        {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">Akun Anda</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
