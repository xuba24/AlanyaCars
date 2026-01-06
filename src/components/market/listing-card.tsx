"use client";

import Link from "next/link";
import {
  Clock,
  Gauge,
  Heart,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";

import { Card } from "@/components/ui/card";
import { PrimaryButton } from "@/components/market/primary-button";
import { MarketBadge } from "@/components/market/market-badge";

type ListingCardItem = {
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

type ListingCardProps = {
  item: ListingCardItem;
  onFavoriteChange?: (next: boolean) => void;
};

export function ListingCard({ item, onFavoriteChange }: ListingCardProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(Boolean(item.isFavorite));
  const [saving, setSaving] = useState(false);
  const updatedLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
      })
    : "Недавно";
  const priceLabel = `${item.price.toLocaleString()} ${
    item.currency === "RUB" ? "₽" : item.currency
  }`;

  async function toggleFavorite(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      if (favorite) {
        const r = await fetch(`/api/favorites/${item.id}`, { method: "DELETE" });
        if (r.status === 401) {
          router.push("/login");
          return;
        }
        if (!r.ok) return;
        setFavorite(false);
        onFavoriteChange?.(false);
      } else {
        const r = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: item.id }),
        });
        if (r.status === 401) {
          router.push("/login");
          return;
        }
        if (!r.ok) return;
        setFavorite(true);
        onFavoriteChange?.(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="group overflow-hidden rounded-2xl border bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted sm:h-44 sm:w-64">
          {item.coverImageUrl ? (
            <img
              src={item.coverImageUrl}
              alt="cover"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            {item.isTop && <MarketBadge variant="top" />}
            {item.isUrgent && <MarketBadge variant="urgent" />}
            {item.isSticker && <MarketBadge variant="vip" />}
          </div>

          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              className={`rounded-full bg-white/85 p-2 shadow-sm transition ${
                favorite ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
              }`}
              aria-label="В избранное"
              onClick={toggleFavorite}
              disabled={saving}
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{item.title}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.city ?? "-"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {item.mileage.toLocaleString()} км
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {updatedLabel}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-semibold">{priceLabel}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Обновлено недавно</div>
            <PrimaryButton size="sm" asChild>
              <Link href={`/listing/${item.slug}`}>Открыть</Link>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
