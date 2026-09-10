import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Role = "ADMIN" | "USER";

// Penjaga API route (SRS §6.1): 401 jika belum login, 403 jika role tak cukup.
export async function requireRole(roles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Belum login" }, { status: 401 }),
    };
  }
  if (!roles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
