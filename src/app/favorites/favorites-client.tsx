"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/market/listing-card";

type Listing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  mileage: number;
  city: string | null;
  createdAt?: string;
  coverImageUrl: string | null;
  isTop: boolean;
  isUrgent: boolean;
  isSticker: boolean;
  isFavorite?: boolean;
};

export default function FavoritesClient() {
  const [items, setItems] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/favorites", { cache: "no-store" });
        const text = await r.text();
        if (!r.ok) {
          if (!cancelled) {
            setError(`/api/favorites: ${r.status} ${text.slice(0, 200)}`);
          }
          return;
        }
        const data = JSON.parse(text);
        if (!cancelled) setItems(data.items ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Ошибка загрузки избранного");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFavoriteChange(id: string, next: boolean) {
    if (!next) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  if (error) {
    return (
      <Card className="rounded-2xl border bg-white/80 p-4 text-sm text-red-600">
        {error}
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border bg-white/80 p-6 text-sm text-muted-foreground">
        Пока нет избранных объявлений.{" "}
        <Link href="/search?dealType=SALE" className="underline">
          Перейти к поиску
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ListingCard
          key={item.id}
          item={item}
          onFavoriteChange={(next) => handleFavoriteChange(item.id, next)}
        />
      ))}
    </div>
  );
}
