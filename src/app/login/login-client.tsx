"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
    <Card className="p-4 space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <div className="mb-1 text-sm font-medium">Email или телефон</div>
        <Input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="mail@example.com или +7 900 000-00-00"
        />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Пароль</div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={loading}>
        {loading ? "Вхожу..." : "Войти"}
      </Button>
    </Card>
  );
}
