"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role?: string | null;
  createdAt?: string | null;
};

function safeJsonParse(text: string) {
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, data: null };
  }
}

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const text = await r.text();
        const parsed = safeJsonParse(text);
        const data = parsed.ok ? parsed.data : null;
        const u = data?.user ?? null;
        if (!cancelled) {
          setUser(u);
          setName(u?.name ?? "");
          setEmail(u?.email ?? "");
          setPhone(u?.phone ?? "");
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          email: email || null,
          phone: phone || null,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`${r.status}: ${text.slice(0, 200)}`);
        return;
      }
      const parsed = safeJsonParse(text);
      if (parsed.ok) {
        setUser(parsed.data?.user ?? null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Вы не авторизованы.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}
      <div className="rounded-lg border bg-muted/20 p-3 text-sm">
        <div className="font-medium">Информация об аккаунте</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">ID</div>
            <div className="break-all text-xs">{user.id}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Роль</div>
            <div className="text-sm">{user.role ?? "USER"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Создан</div>
            <div className="text-sm">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Контакты</div>
            <div className="text-sm">
              {user.email || user.phone
                ? `${user.email ?? ""}${user.email && user.phone ? " / " : ""}${
                    user.phone ?? ""
                  }`
                : "-"}
            </div>
          </div>
        </div>
      </div>

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
      <Button onClick={save} disabled={loading}>
        {loading ? "Сохраняем..." : "Сохранить"}
      </Button>
    </Card>
  );
}
