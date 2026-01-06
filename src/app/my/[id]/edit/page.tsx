import EditListingClient from "./edit-listing-client";
import { getSessionUserIdFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/login");

  const { id } = await params;
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Редактировать черновик</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Изменяй данные и добавляй фото.
      </p>
      <div className="mt-4">
        <EditListingClient id={id} />
      </div>
    </div>
  );
}
