"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedPhone = useMemo(() => {
    if (!phoneDigits) return "";
    return `+7${phoneDigits}`;
  }, [phoneDigits]);

  const isPhoneValid = phoneDigits.length === 10;

  async function submit() {
    setError(null);
    if (!isPhoneValid) return setError("Укажи корректный номер телефона");
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
          phone: normalizedPhone || null,
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
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <div className="text-sm font-medium">Имя</div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            className="h-11 rounded-xl bg-white/80 pl-10 shadow-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Email (необязательно)</div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mail@example.com"
            className="h-11 rounded-xl bg-white/80 pl-10 shadow-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium">Телефон</div>
        <div className="flex items-center gap-2">
          <div className="flex h-11 items-center gap-2 rounded-xl border bg-white/80 px-3 text-sm font-medium shadow-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            +7
          </div>
          <Input
            value={phoneDigits}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhoneDigits(next);
            }}
            placeholder="9000000000"
            inputMode="numeric"
            className="h-11 rounded-xl bg-white/80 shadow-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Номер: +7 и 10 цифр.
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
        {loading ? "Создаём..." : "Зарегистрироваться"}
      </Button>
      <div className="text-center text-xs text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-sky-700 hover:text-sky-900" href="/login">
          Войти
        </Link>
      </div>
    </div>
  );
}
