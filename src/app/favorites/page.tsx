import { getSessionUserIdFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import FavoritesClient from "./favorites-client";

export default async function FavoritesPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Избранное</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ваши сохраненные объявления.
        </p>
      </div>

      <FavoritesClient />
    </div>
  );
}
