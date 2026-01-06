import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: {
        id: true,
        slug: true,
        status: true,
        makeId: true,
        modelId: true,
        year: true,
        price: true,
        currency: true,
        mileage: true,
        registration: true,
        gearbox: true,
        drive: true,
        city: true,
        phone: true,
        description: true,
        images: {
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, url: true, isCover: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    return NextResponse.json({ item: listing });
  } catch (e: any) {
    console.error("MY LISTING GET ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";
    const body = await req.json();

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    if (!isAdmin && listing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Можно редактировать только черновики" },
        { status: 400 }
      );
    }

    const data: any = {};
    const registrationRaw = body.registration ? String(body.registration) : "";
    const allowedRegistrations = new Set(["NOT_CLEARED", "RF", "RSO"]);
    const registration = registrationRaw && allowedRegistrations.has(registrationRaw)
      ? registrationRaw
      : null;
    const gearboxRaw = body.gearbox ? String(body.gearbox) : "";
    const allowedGearboxes = new Set(["MANUAL", "AUTOMATIC", "CVT", "AMT", "OTHER"]);
    const gearbox = gearboxRaw && allowedGearboxes.has(gearboxRaw) ? gearboxRaw : null;
    const driveRaw = body.drive ? String(body.drive) : "";
    const allowedDrives = new Set(["FWD", "RWD", "AWD", "OTHER"]);
    const drive = driveRaw && allowedDrives.has(driveRaw) ? driveRaw : null;

    if (body.makeId) data.makeId = String(body.makeId);
    if (body.modelId) data.modelId = String(body.modelId);
    if (Number.isFinite(Number(body.year))) data.year = Number(body.year);
    if (Number.isFinite(Number(body.price))) data.price = Number(body.price);
    if (Number.isFinite(Number(body.mileage))) data.mileage = Number(body.mileage);
    if (body.registration !== undefined) {
      if (registrationRaw && !registration) {
        return NextResponse.json(
          { error: "Некорректный учет" },
          { status: 400 }
        );
      }
      data.registration = registration;
    }
    if (body.gearbox !== undefined) {
      if (gearboxRaw && !gearbox) {
        return NextResponse.json(
          { error: "Некорректная КПП" },
          { status: 400 }
        );
      }
      data.gearbox = gearbox;
    }
    if (body.drive !== undefined) {
      if (driveRaw && !drive) {
        return NextResponse.json(
          { error: "Некорректный привод" },
          { status: 400 }
        );
      }
      data.drive = drive;
    }

    data.city = body.city ? String(body.city) : null;
    data.phone = body.phone ? String(body.phone) : null;
    data.description = body.description ? String(body.description) : null;

    const updated = await prisma.listing.update({
      where: { id },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (e: any) {
    console.error("MY LISTING PATCH ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireSessionUser();
    const isAdmin = user.role === "ADMIN";

    const listing = await prisma.listing.findFirst({
      where: isAdmin ? { id } : { id, ownerUserId: user.id },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "listing not found" }, { status: 404 });
    }

    if (!isAdmin && listing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Можно удалить только черновики" },
        { status: 400 }
      );
    }

    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("MY LISTING DELETE ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
