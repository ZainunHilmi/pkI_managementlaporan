"use client";

import { signOut } from "next-auth/react";
import type { Tone } from "@/components/ui";

export default function LogoutButton({ tone = "indigo" }: { tone?: Tone }) {
  async function handleLogout() {
    // Jangan pakai callbackUrl: NextAuth me-resolve path relatif ("/login")
    // terhadap NEXTAUTH_URL di server. Kalau env itu masih localhost di
    // Vercel, user nyasar ke http://localhost:3000/login.
    // redirect:false + navigasi manual selalu ikut domain aktif.
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 active:scale-[0.97] ${
        tone === "indigo" ? "hover:bg-indigo-50/50" : "hover:bg-teal-50/50"
      }`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      Keluar
    </button>
  );
}
