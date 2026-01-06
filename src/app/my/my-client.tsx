"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";

type Item = {
  id: string;
  slug: string;
  title: string;
  status: string;
  price: number;
  currency: string;
  mileage: number;
  city: string | null;
  createdAt: string;
  coverImageUrl: string | null;
  rejectReason?: string | null;
};

export default function MyClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const statusOptions = [
    { value: "ALL", label: "Все" },
    { value: "DRAFT", label: "Черновики" },
    { value: "ACTIVE", label: "Активные" },
    { value: "ARCHIVED", label: "Архив" },
    { value: "PENDING_REVIEW", label: "На модерации" },
    { value: "REJECTED", label: "Отклоненные" },
  ];

  async function load() {
    setError(null);
    const qs =
      statusFilter && statusFilter !== "ALL"
        ? `?status=${encodeURIComponent(statusFilter)}`
        : "";
    const r = await fetch(`/api/my/listings${qs}`, { cache: "no-store" });
    const text = await r.text();

    if (!r.ok) {
      setError(`/api/my/listings: ${r.status} ${text.slice(0, 200)}`);
      return;
    }

    try {
      const d = JSON.parse(text);
      setItems(d.items ?? []);
    } catch {
      setError(`/api/my/listings: ответ не JSON: ${text.slice(0, 200)}`);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const text = await r.text();
        if (!r.ok) return;
        const data = JSON.parse(text);
        if (!cancelled) setIsAdmin(data?.user?.role === "ADMIN");
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function publish(id: string) {
    setError(null);
    setLoadingId(id);

    try {
      const r = await fetch(`/api/my/listings/${id}/publish`, {
        method: "POST",
      });
      const text = await r.text();

      if (!r.ok) {
        setError(`/publish: ${r.status} ${text.slice(0, 200)}`);
        return;
      }

      await load();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка публикации");
    } finally {
      setLoadingId(null);
    }
  }

  async function approve(id: string) {
    if (!confirm("Опубликовать объявление?")) return;
    setError(null);
    setLoadingId(id);
    try {
      const r = await fetch(`/api/admin/listings/${id}/approve`, {
        method: "POST",
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`/approve: ${r.status} ${text.slice(0, 200)}`);
        return;
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка публикации");
    } finally {
      setLoadingId(null);
    }
  }

  async function reject(id: string) {
    const reason = prompt("Причина отказа (необязательно):") ?? "";
    if (reason === null) return;
    setError(null);
    setLoadingId(id);
    try {
      const r = await fetch(`/api/admin/listings/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`/reject: ${r.status} ${text.slice(0, 200)}`);
        return;
      }
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка отказа");
    } finally {
      setLoadingId(null);
    }
  }

  async function unpublish(id: string) {
    if (!confirm("Снять объявление с публикации?")) return;
    setError(null);
    setLoadingId(id);

    try {
      const r = await fetch(`/api/my/listings/${id}/unpublish`, {
        method: "POST",
      });
      const text = await r.text();

      if (!r.ok) {
        setError(`/unpublish: ${r.status} ${text.slice(0, 200)}`);
        return;
      }

      await load();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка снятия");
    } finally {
      setLoadingId(null);
    }
  }

  async function removeListing(id: string, status: string) {
    const label = status === "DRAFT" ? "Удалить черновик?" : "Удалить объявление?";
    if (!confirm(label)) return;
    setError(null);
    setLoadingId(id);

    try {
      const r = await fetch(`/api/my/listings/${id}`, {
        method: "DELETE",
      });
      const text = await r.text();

      if (!r.ok) {
        setError(`/delete: ${r.status} ${text.slice(0, 200)}`);
        return;
      }

      await load();
    } catch (e: any) {
      setError(e?.message ?? "Ошибка удаления");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <Card className="border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </Card>
      )}

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={statusFilter === opt.value ? "default" : "secondary"}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Card>

      {items.map((x) => (
        <Card key={x.id} className="p-0 hover:bg-muted/30 transition">
          <div className="flex items-stretch gap-4 p-4">
            <Link href={`/listing/${x.slug}`} className="block flex-1">
              <div className="flex gap-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {x.coverImageUrl ? (
                    <img
                      src={x.coverImageUrl}
                      alt="cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{x.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {x.city ?? "-"} - {x.mileage.toLocaleString()} km
                    </div>
                    {x.status === "REJECTED" && x.rejectReason && (
                      <div className="mt-1 text-xs text-red-500/90">
                        Причина отказа: {x.rejectReason}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(x.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    {(() => {
                      const curLabel = x.currency === "RUB" ? "₽" : x.currency;
                      return (
                    <div className="font-semibold">
                      {x.price.toLocaleString()} {curLabel}
                    </div>
                      );
                    })()}
                    <div className="mt-2 flex justify-end">
                      <Badge variant="secondary">{x.status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex flex-col items-end justify-center gap-2">
              {x.status === "DRAFT" && (
                <>
                  <Button
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      publish(x.id);
                    }}
                  >
                    {loadingId === x.id
                      ? "Отправляю..."
                      : isAdmin
                      ? "Опубликовать"
                      : "На модерацию"}
                  </Button>
                  <Link
                    href={`/my/${x.id}/edit`}
                    className="rounded-md border px-3 py-1 text-xs hover:bg-muted/30"
                  >
                    Изменить
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeListing(x.id, x.status);
                    }}
                  >
                    Удалить
                  </Button>
                </>
              )}
              {x.status === "ACTIVE" && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      unpublish(x.id);
                    }}
                  >
                    Снять
                  </Button>
                  <ShareButton
                    title={x.title}
                    path={`/listing/${x.slug}`}
                    size="sm"
                    variant="secondary"
                  />
                  {isAdmin && (
                    <>
                      <Link
                        href={`/my/${x.id}/edit`}
                        className="rounded-md border px-3 py-1 text-xs hover:bg-muted/30"
                      >
                        Изменить
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={loadingId === x.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeListing(x.id, x.status);
                        }}
                      >
                        Удалить
                      </Button>
                    </>
                  )}
                </>
              )}
              {x.status === "PENDING_REVIEW" && isAdmin && (
                <>
                  <Button
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      approve(x.id);
                    }}
                  >
                    Одобрить
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      reject(x.id);
                    }}
                  >
                    Отклонить
                  </Button>
                </>
              )}
              {x.status !== "DRAFT" && x.status !== "ACTIVE" && isAdmin && (
                <>
                  <Link
                    href={`/my/${x.id}/edit`}
                    className="rounded-md border px-3 py-1 text-xs hover:bg-muted/30"
                  >
                    Изменить
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loadingId === x.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeListing(x.id, x.status);
                    }}
                  >
                    Удалить
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {items.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground">
          Пока нет объявлений. Создай первое: {" "}
          <a className="underline" href="/new">
            /new
          </a>
        </Card>
      )}
    </div>
  );
}
