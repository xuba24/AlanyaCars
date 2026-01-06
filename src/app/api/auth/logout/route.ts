import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSessionUserIdFromCookies, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const userId = await getSessionUserIdFromCookies();

    if (token && userId) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    }

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (e: any) {
    console.error("LOGOUT ERROR:", e);
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  }
}
