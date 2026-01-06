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
    const isAdmin = user.role === "ADMIN";
    console.log("PUBLISH id =", id);

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (isAdmin) {
      const updated = await prisma.listing.update({
        where: { id: listing.id },
        data: { status: "ACTIVE", publishedAt: new Date() },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: updated.id });
    }

    if (listing.status !== "DRAFT" && listing.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Можно отправить на модерацию только черновик или отклоненное" },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "PENDING_REVIEW" },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("PUBLISH ERROR FULL:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
