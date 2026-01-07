"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryImage = {
  url: string;
  isCover?: boolean;
};

type ListingGalleryProps = {
  images: GalleryImage[];
  title: string;
};

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const startIndex = useMemo(() => {
    const coverIndex = images.findIndex((x) => x.isCover);
    return coverIndex >= 0 ? coverIndex : 0;
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [open, setOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images.length === 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    const safeIndex = Math.min(startIndex, images.length - 1);
    setActiveIndex(safeIndex);
    el.scrollTo({ left: safeIndex * el.clientWidth, behavior: "auto" });
  }, [images.length, startIndex]);

  function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth") {
    const el = scrollerRef.current;
    if (!el || images.length === 0) return;
    const safeIndex = (index + images.length) % images.length;
    el.scrollTo({ left: safeIndex * el.clientWidth, behavior });
    setActiveIndex(safeIndex);
  }

  function handleScroll() {
    if (open) return;
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const nextIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (nextIndex !== activeIndex) setActiveIndex(nextIndex);
  }

  if (images.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border bg-muted text-sm text-muted-foreground">
        Пока нет фото
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="relative w-full max-w-full overflow-hidden rounded-2xl border bg-muted">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex w-full max-w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        >
          {images.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              className="relative aspect-[4/3] w-full min-w-full flex-none snap-start bg-muted"
              onClick={() => {
                setActiveIndex(idx);
                setOpen(true);
              }}
              aria-label={`Открыть фото ${idx + 1}`}
            >
              <img
                src={img.url}
                alt={title}
                className="h-full w-full object-cover object-center"
              />
              {img.isCover && (
                <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Обложка
                </span>
              )}
            </button>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-foreground shadow-sm transition hover:bg-white md:flex"
              onClick={() => scrollToIndex(activeIndex - 1)}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-foreground shadow-sm transition hover:bg-white md:flex"
              onClick={() => scrollToIndex(activeIndex + 1)}
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={`${img.url}-thumb-${idx}`}
              type="button"
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition ${
                idx === activeIndex
                  ? "ring-2 ring-primary/60"
                  : "hover:border-primary/40"
              }`}
              onClick={() => scrollToIndex(idx)}
              aria-label={`Перейти к фото ${idx + 1}`}
            >
              <img
                src={img.url}
                alt={`${title}-${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 shadow-sm"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm"
                onClick={() => scrollToIndex(activeIndex - 1, "auto")}
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm"
                onClick={() => scrollToIndex(activeIndex + 1, "auto")}
                aria-label="Следующее фото"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <img
            src={active?.url ?? images[0].url}
            alt={title}
            className="h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
