"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginClient() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    const value = login.trim();
    if (!value) return setError("Укажи email или телефон");
    if (!password) return setError("Пароль обязателен");

    const isEmail = value.includes("@");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? value : null,
          phone: isEmail ? null : value,
          password,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`${r.status}: ${text.slice(0, 200)}`);
        return;
      }
      router.push("/my");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <div className="text-sm font-medium">Email или телефон</div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="mail@example.com или +7 900 000-00-00"
            className="h-11 rounded-xl bg-white/80 pl-10 shadow-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Пароль</div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl bg-white/80 pl-10 shadow-sm"
          />
        </div>
      </div>
      <Button onClick={submit} disabled={loading} className="h-11 w-full rounded-xl">
        {loading ? "Вхожу..." : "Войти"}
      </Button>
      <div className="text-center text-xs text-muted-foreground">
        Нет аккаунта?{" "}
        <Link className="font-medium text-sky-700 hover:text-sky-900" href="/register">
          Зарегистрируйся
        </Link>
      </div>
    </div>
  );
}
