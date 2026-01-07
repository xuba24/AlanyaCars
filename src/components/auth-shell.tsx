import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  subtitle: string;
  active: "login" | "register";
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, active, children }: AuthShellProps) {
  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-sky-200/60 blur-3xl" />
      <div className="absolute -right-16 bottom-6 h-52 w-52 rounded-full bg-indigo-200/50 blur-3xl" />

      <div className="relative rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          <img
            src="/alanyacars-logo.png"
            alt="AlanyaCars"
            className="h-20 w-20 rounded-full object-contain"
          />
        </div>
        <div className="mt-4 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-5 flex items-center rounded-full border bg-slate-100/70 p-1 text-sm">
          <Link
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-center font-medium transition",
              active === "login"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-900"
            )}
            href="/login"
          >
            Вход
          </Link>
          <Link
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-center font-medium transition",
              active === "register"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-900"
            )}
            href="/register"
          >
            Регистрация
          </Link>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
