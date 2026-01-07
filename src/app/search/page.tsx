import { Suspense } from "react";
import SearchClient from "./search-client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border bg-white/80 p-6 text-sm text-muted-foreground shadow-sm">
          Loading...
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
