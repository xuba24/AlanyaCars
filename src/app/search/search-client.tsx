"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Clock,
  Gauge,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/market/chip";
import { FilterPanel } from "@/components/market/filter-panel";
import { ListingCard } from "@/components/market/listing-card";

type Make = { id: string; name: string; slug: string };
type Model = { id: string; name: string; slug: string; makeId: string };

type Listing = {
  coverImageUrl: string | null;
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  mileage: number;
  engineVolume?: string | null;
  city: string | null;
  createdAt?: string;
  isTop: boolean;
  isUrgent: boolean;
  isSticker: boolean;
  isFavorite?: boolean;
};

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!searchParams) {
    return null;
  }

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const q = searchParams.get("q") ?? "";
  const dealType = searchParams.get("dealType") ?? "SALE";
  const makeId = searchParams.get("makeId") ?? "";
  const modelId = searchParams.get("modelId") ?? "";
  const yearFrom = searchParams.get("yearFrom") ?? "";
  const yearTo = searchParams.get("yearTo") ?? "";
  const priceFrom = searchParams.get("priceFrom") ?? "";
  const priceTo = searchParams.get("priceTo") ?? "";
  const city = searchParams.get("city") ?? "";
  const registration = searchParams.get("registration") ?? "";
  const ord = searchParams.get("ord") ?? "date_desc";

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("dealType", dealType);
    if (makeId) p.set("makeId", makeId);
    if (modelId) p.set("modelId", modelId);
    if (yearFrom) p.set("yearFrom", yearFrom);
    if (yearTo) p.set("yearTo", yearTo);
    if (priceFrom) p.set("priceFrom", priceFrom);
    if (priceTo) p.set("priceTo", priceTo);
    if (city) p.set("city", city);
    if (registration) p.set("registration", registration);
    p.set("ord", ord);
    p.set("page", "1");
    p.set("pageSize", "20");
    return p.toString();
  }, [
    dealType,
    makeId,
    modelId,
    yearFrom,
    yearTo,
    priceFrom,
    priceTo,
    city,
    registration,
    ord,
  ]);

  useEffect(() => {
    fetch("/api/makes")
      .then((r) => r.json())
      .then((d) => setMakes(d.makes ?? []))
      .catch(() => setMakes([]));
  }, []);

  useEffect(() => {
    if (!makeId) {
      setModels([]);
      return;
    }
    fetch(`/api/models?makeId=${encodeURIComponent(makeId)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));
  }, [makeId]);

  useEffect(() => {
    fetch(`/api/listings?${query}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      });
  }, [query]);

  const filteredItems = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.title.toLowerCase().includes(needle));
  }, [items, q]);

  const visibleTotal = q.trim() ? filteredItems.length : total;

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (!value) p.delete(key);
    else p.set(key, value);
    p.set("page", "1");
    router.push(`/search?${p.toString()}`);
  }

  function reset() {
    router.push("/search?dealType=SALE");
  }

  function applyFilters() {
    setFiltersOpen(false);
    setFiltersExpanded(false);
  }

  const sortOptions = [
    { value: "date_desc", label: "Новые", icon: Clock },
    { value: "date_asc", label: "Старые", icon: Clock },
    { value: "price_asc", label: "Цена ↑", icon: ArrowUpNarrowWide },
    { value: "price_desc", label: "Цена ↓", icon: ArrowDownNarrowWide },
    { value: "mileage_asc", label: "Пробег ↑", icon: Gauge },
    { value: "mileage_desc", label: "Пробег ↓", icon: Gauge },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <div className="hidden lg:block">
        <Card className="rounded-2xl border bg-white/80 p-4 shadow-sm">
          <FilterPanel
            dealType={dealType}
            makeId={makeId}
            modelId={modelId}
            yearFrom={yearFrom}
            yearTo={yearTo}
            priceFrom={priceFrom}
            priceTo={priceTo}
            city={city}
            registration={registration}
            makes={makes}
            models={models}
            total={visibleTotal}
            onParamChange={setParam}
            onReset={reset}
            onApply={applyFilters}
          />
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">Объявления</div>
            <div className="text-xs text-muted-foreground">
              Найдено: {visibleTotal.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Фильтры
            </Button>
          </div>
        </div>

        <div className="hidden md:block lg:hidden">
          <Card className="rounded-2xl border bg-white/80 p-4 shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-medium"
              onClick={() => setFiltersExpanded((prev) => !prev)}
            >
              Фильтры и параметры
              <ChevronDown
                className={`h-4 w-4 transition ${
                  filtersExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {filtersExpanded && (
              <div className="mt-4">
                <FilterPanel
                  dealType={dealType}
                  makeId={makeId}
                  modelId={modelId}
                  yearFrom={yearFrom}
                  yearTo={yearTo}
                  priceFrom={priceFrom}
                  priceTo={priceTo}
                  city={city}
                  registration={registration}
                  makes={makes}
                  models={models}
                  total={visibleTotal}
                  onParamChange={setParam}
                  onReset={reset}
                  onApply={applyFilters}
                />
              </div>
            )}
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Chip
                key={opt.value}
                active={ord === opt.value}
                onClick={() => setParam("ord", opt.value)}
                icon={<Icon className="h-3.5 w-3.5" />}
              >
                {opt.label}
              </Chip>
            );
          })}
        </div>

        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}

          {filteredItems.length === 0 && (
            <Card className="rounded-2xl border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
              Ничего не найдено. Попробуй убрать фильтры.
            </Card>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Фильтры</div>
              <button
                type="button"
                className="rounded-full border px-3 py-1 text-xs"
                onClick={() => setFiltersOpen(false)}
              >
                Закрыть
              </button>
            </div>
            <FilterPanel
              dealType={dealType}
              makeId={makeId}
              modelId={modelId}
              yearFrom={yearFrom}
              yearTo={yearTo}
              priceFrom={priceFrom}
              priceTo={priceTo}
              city={city}
              registration={registration}
              makes={makes}
              models={models}
              total={visibleTotal}
              onParamChange={setParam}
              onReset={reset}
              onApply={applyFilters}
            />
          </div>
        </div>
      )}
    </div>
  );
}
