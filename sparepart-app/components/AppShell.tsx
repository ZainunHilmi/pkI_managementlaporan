import { BrandMark, type Tone } from "@/components/ui";
import NavLinks from "@/components/NavLinks";
import LogoutButton from "@/components/LogoutButton";

// Kerangka header+navigasi shared untuk panel admin & user.
export default function AppShell({
  title,
  email,
  nav,
  tone,
  children,
}: {
  title: string;
  email: string;
  nav: { href: string; label: string }[];
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex animate-fade-in items-center gap-2.5">
            <BrandMark tone={tone} />
            <span className="font-semibold tracking-tight text-slate-900">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-44 truncate text-sm text-slate-400 sm:block" title={email}>
              {email}
            </span>
            <LogoutButton tone={tone} />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <NavLinks items={nav} tone={tone} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}
