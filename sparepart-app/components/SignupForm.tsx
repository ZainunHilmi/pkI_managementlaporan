"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Alert, Button, Field, Input } from "@/components/ui";

// Form daftar mandiri akun teknisi: daftar → otomatis masuk ke /user/dashboard.
export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Nama wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Gagal mendaftar, coba lagi");
        return;
      }
      // Langsung masuk setelah daftar berhasil.
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/user/dashboard");
      router.refresh();
    } catch {
      setError("Jaringan bermasalah, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="Nama" htmlFor="name">
        <Input
          id="name"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lengkap"
        />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@contoh.com"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
        />
      </Field>
      <Field label="Konfirmasi password" htmlFor="confirm">
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi password"
        />
      </Field>
      <Button type="submit" loading={loading} className="w-full py-3">
        {loading ? "Mendaftarkan..." : "Daftar"}
      </Button>
    </form>
  );
}
