"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

type ShareButtonProps = {
  title?: string;
  path?: string;
  url?: string;
  label?: string;
  className?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
};

export function ShareButton({
  title,
  path,
  url,
  label = "Поделиться",
  className,
  size = "sm",
  variant = "secondary",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  function buildShareUrl() {
    if (url) return url;
    if (typeof window === "undefined") return path ?? "";
    if (path?.startsWith("http")) return path;
    return `${window.location.origin}${path ?? ""}`;
  }

  async function copyToClipboard(value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    if (typeof document !== "undefined") {
      const el = document.createElement("textarea");
      el.value = value;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        document.execCommand("copy");
        return true;
      } finally {
        document.body.removeChild(el);
      }
    }
    return false;
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const nextUrl = buildShareUrl();
      setShareUrl(nextUrl);

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: title ?? "AlanyaCars",
            url: nextUrl,
          });
          return;
        } catch {
          // fallback to custom share sheet
        }
      }
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={handleShare}
        disabled={busy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Скопировано" : label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Поделиться</div>
              <button
                type="button"
                className="rounded-full border p-1"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                className="justify-start"
                onClick={async () => {
                  const ok = await copyToClipboard(shareUrl);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                Копировать ссылку
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  const url = `https://t.me/share/url?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(title ?? "AlanyaCars")}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <Share2 className="h-4 w-4" />
                Telegram
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  const text = `${title ?? "AlanyaCars"} ${shareUrl}`.trim();
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  const url = `https://vk.com/share.php?url=${encodeURIComponent(
                    shareUrl
                  )}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <Share2 className="h-4 w-4" />
                ВКонтакте
              </Button>
            </div>

            <div className="mt-3 break-all rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
              {shareUrl}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
