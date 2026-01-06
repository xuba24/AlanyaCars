"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email && !phone) return setError("Укажи email или телефон");
    if (!password || password.length < 6)
      return setError("Пароль минимум 6 символов");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          email: email || null,
          phone: phone || null,
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
      setError(e?.message ?? "Ошибка регистрации");
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
        <div className="mb-1 text-sm font-medium">Имя</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Email</div>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Телефон</div>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Пароль</div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={loading}>
        {loading ? "Создаём..." : "Зарегистрироваться"}
      </Button>
    </Card>
  );
}
