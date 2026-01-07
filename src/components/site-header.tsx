"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AuthStatus } from "@/components/auth-status";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-3 z-30">
      <div className="rounded-2xl border bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border bg-white/80 px-2.5 py-1.5 text-sm font-semibold tracking-tight shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="AlanyaCars"
          >
            <img
              src="/alanyacars-logo.png"
              alt="AlanyaCars"
              className="h-12 w-auto"
            />
            <span className="ml-0.5 text-lg font-semibold">AlanyaCars</span>
          </Link>

          <form
            action="/search"
            method="get"
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Поиск по авто"
              className="h-10 rounded-full bg-white/80 pl-10 pr-3"
            />
            <input type="hidden" name="dealType" value="SALE" />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold leading-none text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Добавить
            </Link>

            <AuthStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
