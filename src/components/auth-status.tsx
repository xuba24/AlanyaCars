"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ChevronDown, User } from "lucide-react";

type User = { id: string; email: string | null; phone: string | null; name: string | null };

export function AuthStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const d = await r.json();
        if (!cancelled) setUser(d.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    router.push("/login");
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (loading) {
    return <div className="text-xs text-muted-foreground">...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium leading-none transition hover:bg-muted/40"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium leading-none transition hover:bg-muted/40"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium leading-none transition hover:bg-muted/40"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
      >
        <User className="h-4 w-4" />
        Профиль
        <ChevronDown className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border bg-white p-2 shadow-md">
          <Link
            href="/my"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-muted/40"
            onClick={() => setMenuOpen(false)}
          >
            Мои объявления
          </Link>
          <Link
            href="/favorites"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-muted/40"
            onClick={() => setMenuOpen(false)}
          >
            Избранное
          </Link>
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-muted/40"
            onClick={() => setMenuOpen(false)}
          >
            Аккаунт
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/40"
            onClick={logout}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
