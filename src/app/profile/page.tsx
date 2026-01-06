import ProfileClient from "./profile-client";
import { getSessionUserIdFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Управляй своим профилем.
      </p>
      <div className="mt-4">
        <ProfileClient />
      </div>
    </div>
  );
}
