import RegisterClient from "./register-client";
import { AuthShell } from "@/components/auth-shell";

export default function Page() {
  return (
    <AuthShell
      title="Создай аккаунт"
      subtitle="Регистрация занимает меньше минуты."
      active="register"
    >
      <RegisterClient />
    </AuthShell>
  );
}
