import Link from "next/link";
import type { ReactNode } from "react";

// Sistem komponen UI shared — "soft professional":
// kartu putih rounded-2xl, shadow lembut, aksen indigo/teal, animasi ringan.

export type Tone = "indigo" | "teal";

const toneText: Record<Tone, string> = {
  indigo: "text-indigo-700",
  teal: "text-teal-700",
};

const toneRing: Record<Tone, string> = {
  indigo: "focus:border-indigo-400 focus:ring-indigo-100",
  teal: "focus:border-teal-400 focus:ring-teal-100",
};

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/70 bg-white/90 shadow-soft backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  delay = "0ms",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  delay?: string;
}) {
  return (
    <div className="flex animate-fade-up flex-wrap items-end justify-between gap-3" style={{ animationDelay: delay }}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  variant?: "primary" | "secondary" | "danger-soft";
  loading?: boolean;
};

export function Button({
  tone = "indigo",
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? tone === "indigo"
        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-lift"
        : "bg-teal-600 text-white shadow-sm hover:bg-teal-500 hover:shadow-lift"
      : variant === "danger-soft"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  tone = "indigo",
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  tone?: Tone;
  variant?: "primary" | "secondary" | "danger-soft";
  className?: string;
  children: ReactNode;
}) {
  const styles =
    variant === "primary"
      ? tone === "indigo"
        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-lift"
        : "bg-teal-600 text-white shadow-sm hover:bg-teal-500 hover:shadow-lift"
      : variant === "danger-soft"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:ring-4";

export function Input({
  tone = "indigo",
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { tone?: Tone }) {
  return <input className={`${inputBase} ${toneRing[tone]} ${className}`} {...rest} />;
}

export function Textarea({
  tone = "indigo",
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone }) {
  return <textarea className={`${inputBase} ${toneRing[tone]} ${className}`} {...rest} />;
}

export function Select({
  tone = "indigo",
  className = "",
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone }) {
  return (
    <select className={`${inputBase} ${toneRing[tone]} pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Alert({
  tone,
  children,
  role,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
  role?: string;
}) {
  const styles =
    tone === "error"
      ? "border-rose-200/70 bg-rose-50/80 text-rose-700"
      : tone === "success"
        ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
        : "border-sky-200/70 bg-sky-50/80 text-sky-700";
  const dot = tone === "error" ? "bg-rose-400" : tone === "success" ? "bg-emerald-400" : "bg-sky-400";
  return (
    <p role={role ?? (tone === "error" ? "alert" : "status")} className={`flex animate-fade-in items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span>{children}</span>
    </p>
  );
}

type BadgeTone = "emerald" | "amber" | "rose" | "slate" | "indigo" | "teal";

const badgeStyles: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
};

const badgeDot: Record<BadgeTone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badgeStyles[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${badgeDot[tone]}`} />
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
  danger = false,
  delay = "0ms",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: Tone;
  danger?: boolean;
  delay?: string;
}) {
  return (
    <Card
      className={`group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${danger ? "border-rose-200" : ""}`}
    >
      <div className="flex animate-fade-up items-center gap-4" style={{ animationDelay: delay }}>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110 ${
            danger
              ? "bg-rose-50 text-rose-600"
              : tone === "indigo"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-teal-50 text-teal-600"
          }`}
        >
          {icon}
        </span>
        <span>
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
          <span className={`block text-2xl font-semibold tracking-tight ${danger ? "text-rose-700" : "text-slate-900"}`}>
            {value}
          </span>
        </span>
      </div>
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center gap-1 px-4 py-10 text-center">
      <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        <BoxIcon />
      </span>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-slate-700 ${className}`}>{children}</td>;
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function BoxIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function BrandMark({ tone = "indigo" }: { tone?: Tone }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${
        tone === "indigo"
          ? "bg-gradient-to-br from-indigo-500 to-violet-600"
          : "bg-gradient-to-br from-teal-500 to-emerald-600"
      }`}
    >
      <BoxIcon className="h-5 w-5" />
    </span>
  );
}

export { toneText };
export type { ReactNode };
