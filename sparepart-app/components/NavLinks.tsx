"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Tone } from "@/components/ui";

// Navigasi pill dengan status aktif (aksen mengikuti panel).
export default function NavLinks({
  items,
  tone = "indigo",
}: {
  items: { href: string; label: string }[];
  tone?: Tone;
}) {
  const pathname = usePathname();
  const active =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
      : "bg-teal-50 text-teal-700 ring-teal-200";

  return (
    <nav className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-all duration-200 ${
              isActive
                ? `${active} shadow-sm`
                : "bg-transparent text-slate-500 ring-transparent hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
