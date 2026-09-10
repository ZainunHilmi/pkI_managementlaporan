import { ButtonLink, Card } from "@/components/ui";

// Halaman tujuan redirect saat role tidak diizinkan (SRS §2.2).
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm animate-pop-in p-7 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </span>
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-slate-900">
          Akses Ditolak
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Akun Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
        <ButtonLink href="/login" className="w-full">
          Kembali ke halaman masuk
        </ButtonLink>
      </Card>
    </main>
  );
}
