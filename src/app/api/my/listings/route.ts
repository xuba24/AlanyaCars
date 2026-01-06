import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const allowedStatuses = new Set([
      "DRAFT",
      "PENDING_REVIEW",
      "ACTIVE",
      "ARCHIVED",
      "REJECTED",
    ]);
    const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : null;
    const items = await prisma.listing.findMany({
      where: {
        ...(isAdmin ? {} : { ownerUserId: user.id }),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        price: true,
        currency: true,
        mileage: true,
        city: true,
        createdAt: true,
        moderationLogs: {
          where: { action: "REJECT" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { reason: true, createdAt: true },
        },
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    });

    return NextResponse.json({
      items: items.map((x) => ({
        id: x.id,
        slug: x.slug,
        title: x.title,
        status: x.status,
        price: x.price,
        currency: x.currency,
        mileage: x.mileage,
        city: x.city,
        createdAt: x.createdAt,
        coverImageUrl: x.images[0]?.url ?? null,
        rejectReason: x.moderationLogs[0]?.reason ?? null,
      })),
    });
  } catch (e: any) {
    console.error("MY LISTINGS ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
