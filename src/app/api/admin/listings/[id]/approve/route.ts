import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (listing.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        { error: "Listing is not pending review" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.listing.update({
        where: { id },
        data: { status: "ACTIVE", publishedAt: new Date() },
      }),
      prisma.moderationLog.create({
        data: {
          listingId: id,
          adminId: user.id,
          action: "APPROVE",
          reason: null,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("ADMIN APPROVE ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
