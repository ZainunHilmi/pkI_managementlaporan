import { Prisma, PrismaClient } from "@prisma/client";

// Prisma client singleton — satu instance dipakai ulang antar render Server
// Component / Route Handler. Tanpa ini, HMR di dev membuat client baru tiap
// reload dan connection pool (default limit 5) cepat habis → P2024
// "Timed out fetching a new connection from the connection pool".
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Simpan ke global di semua env (termasuk production/Vercel) agar
// container serverless yang di-reuse tidak bikin client + pool baru
// tiap invocation → hemat koneksi CockroachDB.
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isPoolTimeoutError(e: unknown) {
  const err = e as { code?: string; message?: string };
  return (
    err?.code === "P2024" ||
    (typeof err?.message === "string" &&
      (err.message.includes("Timed out fetching a new connection") ||
        err.message.includes("connection pool")))
  );
}

// Retry khusus error pool timeout (P2024). Dipakai setiap query Server
// Component agar navigasi cepat pindah-pindah halaman tidak langsung
// melempar Unhandled Runtime Error, melainkan coba ulang dengan backoff.
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (!isPoolTimeoutError(e) || attempt === retries) throw e;
      // Backoff: 300ms, 600ms, ... — beri waktu koneksi kembali ke pool.
      if (e instanceof Prisma.PrismaClientKnownRequestError) void e;
      await sleep(300 * (attempt + 1));
    }
  }
  throw lastError;
}
