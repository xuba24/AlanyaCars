"use client";

import { Gauge, Heart, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";

import { Card } from "@/components/ui/card";
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

  function openListing() {
    router.push(`/listing/${item.slug}`);
  }

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/50 bg-white/35 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/80 hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.35)_35%,rgba(255,255,255,0)_70%)] before:opacity-80 before:transition before:duration-300 after:pointer-events-none after:absolute after:inset-0 after:rounded-3xl after:bg-[linear-gradient(135deg,rgba(255,255,255,0.35),rgba(255,255,255,0.08))] after:opacity-70"
      role="link"
      tabIndex={0}
      onClick={openListing}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openListing();
        }
      }}
    >
      <div className="relative z-10 flex flex-col sm:flex-row">
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

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">{item.title}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.city ?? "-"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {item.mileage.toLocaleString()} км
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-semibold">{priceLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
