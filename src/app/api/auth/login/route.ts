import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = body.password ? String(body.password) : "";

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Укажи email или телефон" },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json({ error: "Пароль обязателен" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as any,
      },
      select: { id: true, email: true, phone: true, name: true, passwordHash: true },
    });

    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 401 }
      );
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name },
    });
    setSessionCookie(response, session.token);
    return response;
  } catch (e: any) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
