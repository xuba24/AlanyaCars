"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type MarketBadgeVariant = "top" | "vip" | "urgent" | "verified" | "discount";

const variants: Record<MarketBadgeVariant, string> = {
  top: "bg-primary text-primary-foreground",
  vip: "bg-slate-900 text-white",
  urgent: "bg-destructive text-destructive-foreground",
  verified: "bg-emerald-500 text-white",
  discount: "bg-amber-400 text-amber-950",
};

const labels: Record<MarketBadgeVariant, string> = {
  top: "TOP",
  vip: "VIP",
  urgent: "Срочно",
  verified: "Проверено",
  discount: "Скидка",
};

type MarketBadgeProps = {
  variant: MarketBadgeVariant;
  className?: string;
  children?: React.ReactNode;
};

export function MarketBadge({ variant, className, children }: MarketBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children ?? labels[variant]}
    </span>
  );
}
