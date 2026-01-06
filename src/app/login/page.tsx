import LoginClient from "./login-client";

export default function Page() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Вход</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Войди, чтобы создавать объявления.
      </p>
      <div className="mt-4">
        <LoginClient />
      </div>
    </div>
  );
}
