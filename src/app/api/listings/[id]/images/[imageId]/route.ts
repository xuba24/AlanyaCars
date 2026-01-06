import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    if (!id || !imageId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: { id: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    const image = await prisma.listingImage.findFirst({
      where: { id: imageId, listingId: listing.id },
      select: { id: true, isCover: true },
    });

    if (!image) {
      return NextResponse.json({ error: "image not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.listingImage.delete({ where: { id: image.id } });

      if (image.isCover) {
        const next = await tx.listingImage.findFirst({
          where: { listingId: listing.id },
          orderBy: [
            { isCover: "desc" },
            { sortOrder: "asc" },
            { createdAt: "asc" },
          ],
          select: { id: true },
        });

        if (next) {
          await tx.listingImage.update({
            where: { id: next.id },
            data: { isCover: true },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE IMAGE ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
