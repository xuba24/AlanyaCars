import RegisterClient from "./register-client";

export default function Page() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Регистрация</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Создай аккаунт, чтобы управлять объявлениями.
      </p>
      <div className="mt-4">
        <RegisterClient />
      </div>
    </div>
  );
}
