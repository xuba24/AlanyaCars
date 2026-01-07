"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Make = { id: string; name: string; slug: string };
type Model = { id: string; name: string; slug: string; makeId: string };

const CITY_OPTIONS = ["ЦХИНВАЛ", "ВЛАДИКАВКАЗ"];

function safeJsonParse(text: string) {
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, data: null };
  }
}

export default function NewListingClient() {
  const router = useRouter();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");

  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");

  const [registration, setRegistration] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [drive, setDrive] = useState("");
  const [city, setCity] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [description, setDescription] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const yearNum = useMemo(() => Number(year), [year]);
  const priceNum = useMemo(() => Number(price), [price]);
  const mileageNum = useMemo(() => Number(mileage), [mileage]);
  const normalizedPhone = useMemo(() => {
    if (!phoneDigits) return "";
    return `+7${phoneDigits}`;
  }, [phoneDigits]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  function addPhotos(files: File[]) {
    if (files.length === 0) return;
    setPhotos((prev) => {
      const next = [...prev];
      for (const f of files) {
        const exists = next.some(
          (x) =>
            x.name === f.name &&
            x.size === f.size &&
            x.lastModified === f.lastModified
        );
        if (!exists) next.push(f);
      }
      return next.slice(0, 10);
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // 1) загрузка марок
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);

        const r = await fetch("/api/makes", { cache: "no-store" });
        const text = await r.text();

        if (!r.ok) {
          if (!cancelled) setError(`/api/makes: ${r.status} ${text.slice(0, 180)}`);
          return;
        }

        const parsed = safeJsonParse(text);
        if (!parsed.ok) {
          if (!cancelled) setError(`/api/makes: ответ не JSON: ${text.slice(0, 180)}`);
          return;
        }

        if (!cancelled) setMakes(parsed.data?.makes ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Ошибка загрузки марок");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2) загрузка моделей при выборе марки
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);

        if (!makeId) {
          setModels([]);
          setModelId("");
          return;
        }

        const r = await fetch(`/api/models?makeId=${encodeURIComponent(makeId)}`, {
          cache: "no-store",
        });
        const text = await r.text();

        if (!r.ok) {
          if (!cancelled) setError(`/api/models: ${r.status} ${text.slice(0, 180)}`);
          if (!cancelled) setModels([]);
          return;
        }

        const parsed = safeJsonParse(text);
        if (!parsed.ok) {
          if (!cancelled) setError(`/api/models: ответ не JSON: ${text.slice(0, 180)}`);
          if (!cancelled) setModels([]);
          return;
        }

        if (!cancelled) setModels(parsed.data?.models ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Ошибка загрузки моделей");
        if (!cancelled) setModels([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [makeId]);

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.set("file", file);

    const r = await fetch("/api/uploads/image", {
      method: "POST",
      body: fd,
    });

    const text = await r.text();
    if (!r.ok) {
      throw new Error(`/api/uploads/image: ${r.status} ${text.slice(0, 180)}`);
    }

    const parsed = safeJsonParse(text);
    if (!parsed.ok) {
      throw new Error(`/api/uploads/image: ответ не JSON: ${text.slice(0, 180)}`);
    }

    const url = parsed.data?.url;
    if (!url) {
      throw new Error(`/api/uploads/image: нет url в ответе: ${text.slice(0, 180)}`);
    }

    return {
      url: String(url),
      publicId: parsed.data?.publicId ? String(parsed.data.publicId) : null,
    };
  }

  // 3) создание черновика
  async function submit() {
    setError(null);

    if (!makeId) return setError("Выбери марку");
    if (!modelId) return setError("Выбери модель");
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100)
      return setError("Год должен быть числом (например 2018)");
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return setError("Цена должна быть числом больше 0");
    if (!Number.isFinite(mileageNum) || mileageNum < 0)
      return setError("Пробег должен быть числом 0 или больше");
    if (!gearbox) return setError("Выбери КПП");
    if (!drive) return setError("Выбери привод");
    if (photos.length > 10) return setError("Максимум 10 фото");

    setLoading(true);

    try {
      const payload = {
        makeId,
        modelId,
        year: yearNum,
        price: priceNum,
        mileage: mileageNum,
        registration: registration || null,
        gearbox: gearbox || null,
        drive: drive || null,
        city: city || null,
        phone: normalizedPhone || null,
        description: description || null,
      };

      // ✅ ВАЖНО: правильный endpoint
      const r = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await r.text();

      if (!r.ok) {
        setError(`/api/listings/create: ${r.status} ${text.slice(0, 220)}`);
        return;
      }

      const parsed = safeJsonParse(text);
      if (!parsed.ok) {
        setError(`/api/listings/create: ответ не JSON: ${text.slice(0, 220)}`);
        return;
      }

      const id = parsed.data?.id;
      const slug = parsed.data?.slug;
      if (!id || !slug) {
        setError(`/api/listings/create: нет id/slug в ответе: ${text.slice(0, 220)}`);
        return;
      }

      if (photos.length > 0) {
        const uploaded: Array<{ url: string; publicId: string | null }> = [];
        for (const file of photos) {
          uploaded.push(await uploadOne(file));
        }

        const r2 = await fetch(`/api/listings/${encodeURIComponent(String(id))}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: uploaded }),
        });
        const text2 = await r2.text();
        if (!r2.ok) {
          setError(`/api/listings/${id}/images: ${r2.status} ${text2.slice(0, 220)}`);
          return;
        }
      }

      router.push(`/my?created=${encodeURIComponent(slug)}`);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка создания объявления");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-sm font-medium">Марка *</div>
          <Select
            value={makeId || "__"}
            onValueChange={(v) => {
              const next = v === "__" ? "" : v;
              setMakeId(next);
              setModelId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери марку" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Выбрать</SelectItem>
              {makes.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Модель *</div>
          <Select
            value={modelId || "__"}
            onValueChange={(v) => setModelId(v === "__" ? "" : v)}
            disabled={!makeId}
          >
            <SelectTrigger>
              <SelectValue placeholder={makeId ? "Выбери модель" : "Сначала выбери марку"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Выбрать</SelectItem>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Год *</div>
          <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Год" />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Цена (₽) *</div>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Цена" />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Пробег (км) *</div>
          <Input value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="95000" />
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Город</div>
          <Select
            value={city || "__"}
            onValueChange={(v) => setCity(v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери город" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Выбрать</SelectItem>
              {CITY_OPTIONS.map((cityOption) => (
                <SelectItem key={cityOption} value={cityOption}>
                  {cityOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Учет</div>
          <Select
            value={registration || "__"}
            onValueChange={(v) => setRegistration(v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Не указано</SelectItem>
              <SelectItem value="NOT_CLEARED">Не растаможен</SelectItem>
              <SelectItem value="RF">RUS</SelectItem>
              <SelectItem value="RSO">RSO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">КПП *</div>
          <Select
            value={gearbox || "__"}
            onValueChange={(v) => setGearbox(v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Выбрать</SelectItem>
              <SelectItem value="MANUAL">Механика</SelectItem>
              <SelectItem value="AUTOMATIC">Автомат</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">Привод *</div>
          <Select
            value={drive || "__"}
            onValueChange={(v) => setDrive(v === "__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выбери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__">Выбрать</SelectItem>
              <SelectItem value="FWD">Передний</SelectItem>
              <SelectItem value="RWD">Задний</SelectItem>
              <SelectItem value="AWD">Полный</SelectItem>
              <SelectItem value="OTHER">Другое</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
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
        </div>

        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium">Описание</div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опиши авто..." />
        </div>

        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium">Фотографии</div>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              addPhotos(list);
              e.currentTarget.value = "";
            }}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            До 10 фото, первое станет обложкой. Можно добавлять несколькими
            выборами.
          </div>

          {photoPreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {photoPreviews.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="relative overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={src}
                    alt={`preview-${idx}`}
                    className="h-20 w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs"
                    onClick={() => removePhoto(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={submit} disabled={loading}>
          {loading ? "Создаём..." : "Создать (черновик)"}
        </Button>
      </div>
    </Card>
  );
}
