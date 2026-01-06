import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

type IncomingImage = {
  url: string;
  publicId?: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: { id: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    const body = await req.json();
    const images = (body?.images ?? []) as IncomingImage[];

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "images[] is required" }, { status: 400 });
    }

    const cleaned = images
      .map((x) => ({
        url: String(x?.url ?? "").trim(),
        publicId: x?.publicId ? String(x.publicId) : null,
      }))
      .filter((x) => x.url);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "no valid images" }, { status: 400 });
    }

    const [existingCover, lastSort] = await Promise.all([
      prisma.listingImage.findFirst({
        where: { listingId: listing.id, isCover: true },
        select: { id: true },
      }),
      prisma.listingImage.findFirst({
        where: { listingId: listing.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    ]);

    const start = (lastSort?.sortOrder ?? -1) + 1;
    const shouldSetCover = !existingCover;

    await prisma.listingImage.createMany({
      data: cleaned.map((img, idx) => ({
        listingId: listing.id,
        url: img.url,
        publicId: img.publicId,
        sortOrder: start + idx,
        isCover: shouldSetCover && idx === 0,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("ATTACH IMAGES ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
