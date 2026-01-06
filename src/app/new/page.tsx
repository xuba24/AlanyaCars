import NewListingClient from "./new-listing-client";
import { getSessionUserIdFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Добавить объявление</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        MVP: создаём черновик (DRAFT)
      </p>

      <div className="mt-4">
        <NewListingClient />
      </div>
    </div>
  );
}
