"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
        <div className="flex items-center gap-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
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
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Номер: +7 и 10 цифр.
        </div>
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
