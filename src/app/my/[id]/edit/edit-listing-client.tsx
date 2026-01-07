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
type ListingImage = { id: string; url: string; isCover: boolean };

const CITY_OPTIONS = ["ЦХИНВАЛ", "ВЛАДИКАВКАЗ"];

function toPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("7") && digits.length === 11) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

function safeJsonParse(text: string) {
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, data: null };
  }
}

export default function EditListingClient({ id }: { id: string }) {
  const router = useRouter();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");

  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");
  const [engineVolume, setEngineVolume] = useState("");

  const [registration, setRegistration] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [drive, setDrive] = useState("");
  const [city, setCity] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [description, setDescription] = useState("");

  const [existingImages, setExistingImages] = useState<ListingImage[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingListing, setLoadingListing] = useState(true);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

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

  // load makes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const r = await fetch("/api/makes", { cache: "no-store" });
        const text = await r.text();
        if (!r.ok) {
          if (!cancelled)
            setError(`/api/makes: ${r.status} ${text.slice(0, 180)}`);
          return;
        }

        const parsed = safeJsonParse(text);
        if (!parsed.ok) {
          if (!cancelled)
            setError(`/api/makes: ответ не JSON: ${text.slice(0, 180)}`);
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

  // load listing data
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setLoadingListing(true);
        const r = await fetch(`/api/my/listings/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const text = await r.text();
        if (!r.ok) {
          if (!cancelled)
            setError(`/api/my/listings/${id}: ${r.status} ${text.slice(0, 180)}`);
          return;
        }

        const parsed = safeJsonParse(text);
        if (!parsed.ok) {
          if (!cancelled)
            setError(
              `/api/my/listings/${id}: ответ не JSON: ${text.slice(0, 180)}`
            );
          return;
        }

        const item = parsed.data?.item;
        if (!item) {
          if (!cancelled) setError("Объявление не найдено");
          return;
        }

        if (!cancelled) {
          setMakeId(item.makeId ?? "");
          setModelId(item.modelId ?? "");
          setYear(String(item.year ?? ""));
          setPrice(String(item.price ?? ""));
          setMileage(String(item.mileage ?? ""));
          setEngineVolume(item.engineVolume ?? "");
          setRegistration(item.registration ?? "");
          setGearbox(item.gearbox ?? "");
          setDrive(item.drive ?? "");
          setCity(item.city ?? "");
          setPhoneDigits(toPhoneDigits(item.phone ?? ""));
          setDescription(item.description ?? "");
          setExistingImages(item.images ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Ошибка загрузки объявления");
      } finally {
        if (!cancelled) setLoadingListing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // load models on make change
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
          if (!cancelled)
            setError(`/api/models: ${r.status} ${text.slice(0, 180)}`);
          if (!cancelled) setModels([]);
          return;
        }

        const parsed = safeJsonParse(text);
        if (!parsed.ok) {
          if (!cancelled)
            setError(`/api/models: ответ не JSON: ${text.slice(0, 180)}`);
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
    const r = await fetch("/api/uploads/image", { method: "POST", body: fd });
    const text = await r.text();
    if (!r.ok) throw new Error(`/api/uploads/image: ${r.status} ${text.slice(0, 180)}`);

    const parsed = safeJsonParse(text);
    if (!parsed.ok) throw new Error(`/api/uploads/image: ответ не JSON: ${text.slice(0, 180)}`);
    const url = parsed.data?.url;
    if (!url) throw new Error(`/api/uploads/image: нет url в ответе: ${text.slice(0, 180)}`);

    return { url: String(url), publicId: parsed.data?.publicId ? String(parsed.data.publicId) : null };
  }

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
    const engineVolumeValue = engineVolume.trim().replace(",", ".");
    if (engineVolumeValue && !/^\d+(\.\d{1,2})?$/.test(engineVolumeValue)) {
      return setError("Объем двигателя: например 1.6");
    }
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
        engineVolume: engineVolumeValue || null,
      };

      const r = await fetch(`/api/my/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`/api/my/listings/${id}: ${r.status} ${text.slice(0, 220)}`);
        return;
      }

      if (photos.length > 0) {
        const uploaded: Array<{ url: string; publicId: string | null }> = [];
        for (const file of photos) uploaded.push(await uploadOne(file));

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

      router.push(`/my?updated=${encodeURIComponent(id)}`);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сохранения объявления");
    } finally {
      setLoading(false);
    }
  }

  async function removeDraft() {
    if (!confirm("Удалить черновик?")) return;
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`/api/my/listings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`/api/my/listings/${id}: ${r.status} ${text.slice(0, 220)}`);
        return;
      }
      router.push("/my?deleted=1");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка удаления");
    } finally {
      setLoading(false);
    }
  }

  async function removeExistingImage(imageId: string) {
    if (!confirm("Удалить фото?")) return;
    setError(null);
    setDeletingImageId(imageId);
    try {
      const r = await fetch(
        `/api/listings/${encodeURIComponent(id)}/images/${encodeURIComponent(
          imageId
        )}`,
        { method: "DELETE" }
      );
      const text = await r.text();
      if (!r.ok) {
        setError(
          `/api/listings/${id}/images/${imageId}: ${r.status} ${text.slice(0, 220)}`
        );
        return;
      }
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e: any) {
      setError(e?.message ?? "Ошибка удаления фото");
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <Card className="space-y-3 p-4">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}

      {loadingListing ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : (
        <>
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
                  <SelectValue
                    placeholder={makeId ? "Выбери модель" : "Сначала выбери марку"}
                  />
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
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium">Цена (₽) *</div>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium">Пробег (км) *</div>
              <Input value={mileage} onChange={(e) => setMileage(e.target.value)} />
            </div>

            <div>
              <div className="mb-1 text-sm font-medium">Объем двигателя (л)</div>
              <Input
                value={engineVolume}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
                  const [intPart, ...rest] = cleaned.split(".");
                  const normalized = rest.length ? `${intPart}.${rest.join("")}` : intPart;
                  setEngineVolume(normalized.slice(0, 6));
                }}
                placeholder="2.0"
                inputMode="decimal"
              />
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
              <div className="mb-1 text-sm font-medium">КПП</div>
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
              <div className="mb-1 text-sm font-medium">Привод</div>
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
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-sm font-medium">Текущие фото</div>
              {existingImages.length === 0 ? (
                <div className="text-xs text-muted-foreground">Пока нет фото</div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted"
                    >
                      <img src={img.url} alt="existing" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs"
                        onClick={() => removeExistingImage(img.id)}
                        disabled={deletingImageId === img.id}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-sm font-medium">Добавить фото</div>
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
                До 10 фото, первое станет обложкой (если обложки ещё нет).
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

          <div className="flex gap-2 pt-2">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button variant="destructive" onClick={removeDraft} disabled={loading}>
              Удалить черновик
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
