import LoginClient from "./login-client";
import { AuthShell } from "@/components/auth-shell";

export default function Page() {
  return (
    <AuthShell
      title="Добро пожаловать"
      subtitle="Войди, чтобы управлять объявлениями."
      active="login"
    >
      <LoginClient />
    </AuthShell>
  );
}
