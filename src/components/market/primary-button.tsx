"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = React.ComponentProps<typeof Button>;

export function PrimaryButton({ className, ...props }: PrimaryButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:ring-primary/30",
        className
      )}
    />
  );
}
