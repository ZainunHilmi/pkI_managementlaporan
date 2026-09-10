import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import { BrandMark, Card } from "@/components/ui";

// Halaman daftar mandiri akun teknisi (route group tidak memengaruhi URL → /signup).
export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="zoom-auth w-full max-w-sm animate-pop-in p-7">
        <div className="mb-1 flex items-center gap-2.5">
          <BrandMark />
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Daftar Akun Teknisi
          </h1>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Isi data di bawah untuk mulai mencatat pemakaian sparepart.
        </p>
        <SignupForm />
        <p className="mt-5 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Masuk
          </Link>
        </p>
      </Card>
    </main>
  );
}
