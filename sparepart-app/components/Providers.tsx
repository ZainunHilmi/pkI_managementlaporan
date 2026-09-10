"use client";

import { SessionProvider } from "next-auth/react";

// Provider sesi NextAuth untuk seluruh aplikasi (langkah 8 SRS §9).
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
