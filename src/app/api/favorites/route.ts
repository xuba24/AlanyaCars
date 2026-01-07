import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            currency: true,
            mileage: true,
            engineVolume: true,
            city: true,
            createdAt: true,
            isTop: true,
            isUrgent: true,
            isSticker: true,
            images: {
              where: { isCover: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    const items = favorites
      .map((x) => x.listing)
      .filter(Boolean)
      .map((x) => {
        const { images, ...rest } = x;
        return {
          ...rest,
          coverImageUrl: images?.[0]?.url ?? null,
          isFavorite: true,
        };
      });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("FAVORITES GET ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const body = await req.json();
    const listingId = body?.listingId ? String(body.listingId) : "";
    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      update: {},
      create: { userId: user.id, listingId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("FAVORITES POST ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
