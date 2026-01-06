import Link from "next/link";
import { getSessionUserIdFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import MyClient from "./my-client";

export default async function Page() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Мои объявления</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MVP: объявления тестового пользователя
          </p>
        </div>

        <Link
          href="/new"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted/30"
        >
          + Добавить
        </Link>
      </div>

      <div className="mt-4">
        <MyClient />
      </div>
    </div>
  );
}
