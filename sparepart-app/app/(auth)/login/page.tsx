import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { BrandMark, Card } from "@/components/ui";

// Langkah 8 SRS §9: halaman login (route group tidak memengaruhi URL → /login).
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="zoom-auth w-full max-w-sm animate-pop-in p-7">
        <div className="mb-1 flex items-center gap-2.5">
          <BrandMark />
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Manajemen Sparepart
          </h1>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Masuk untuk mengelola inventaris suku cadang.
        </p>
        <LoginForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Daftar
          </Link>
        </p>
      </Card>
    </main>
  );
}
