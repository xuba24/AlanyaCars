import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const name = body.name ? String(body.name).trim() : null;
    const password = body.password ? String(body.password) : "";

    if (!phone) {
      return NextResponse.json(
        { error: "Укажи телефон" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Пароль минимум 6 символов" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          { phone },
        ].filter(Boolean) as any,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь уже существует" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash: hashPassword(password),
        role: "USER",
      } as any,
      select: { id: true, email: true, phone: true, name: true },
    });

    const session = await createSession(user.id);
    const response = NextResponse.json({ ok: true, user });
    setSessionCookie(response, session.token);
    return response;
  } catch (e: any) {
    console.error("REGISTER ERROR:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
