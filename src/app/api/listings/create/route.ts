import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const ownerId = await requireUserId();
    const body = await req.json();

    const makeId = String(body.makeId ?? "");
    const modelId = String(body.modelId ?? "");

    const year = Number(body.year);
    const price = Number(body.price);
    const mileage = Number(body.mileage);

    const city = body.city ? String(body.city) : null;
    const registrationRaw = body.registration ? String(body.registration) : null;
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
    const phone = body.phone ? String(body.phone) : null;
    const description = body.description ? String(body.description) : null;

    // ---- validation ----
    if (!makeId || !modelId) {
      return NextResponse.json({ error: "makeId и modelId обязательны" }, { status: 400 });
    }
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Некорректный year" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Некорректный price" }, { status: 400 });
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      return NextResponse.json({ error: "Некорректный mileage" }, { status: 400 });
    }
    if (registrationRaw && !registration) {
      return NextResponse.json({ error: "Некорректный учет" }, { status: 400 });
    }
    if (!gearboxRaw) {
      return NextResponse.json({ error: "КПП обязательна" }, { status: 400 });
    }
    if (!gearbox) {
      return NextResponse.json({ error: "Некорректная КПП" }, { status: 400 });
    }
    if (!driveRaw) {
      return NextResponse.json({ error: "Привод обязателен" }, { status: 400 });
    }
    if (!drive) {
      return NextResponse.json({ error: "Некорректный привод" }, { status: 400 });
    }

    // ---- load make/model names to build title ----
    const [make, model] = await Promise.all([
      prisma.make.findUnique({ where: { id: makeId }, select: { name: true, slug: true } }),
      prisma.model.findUnique({ where: { id: modelId }, select: { name: true, slug: true } }),
    ]);

    if (!make || !model) {
      return NextResponse.json({ error: "Марка или модель не найдены" }, { status: 400 });
    }

    const title = `${make.name} ${model.name} ${year}`;
    const slug = `${slugify(make.slug ?? make.name)}-${slugify(model.slug ?? model.name)}-${year}-${Date.now()}`;

    // ✅ обязательный owner
    const created = await prisma.listing.create({
        data: {
          slug,
          title,

          // ✅ обязательные связи
          make: { connect: { id: makeId } },
          model: { connect: { id: modelId } },

          // ✅ обязательный owner
          owner: { connect: { id: ownerId } },

          dealType: "SALE",
          status: "DRAFT",

          year,
          price,
          currency: "RUB",
          mileage,
          registration,

          city,
          phone,
          description,

          gearbox,
          drive,
        } as any,
        select: { id: true, slug: true },
      });


    return NextResponse.json({ id: created.id, slug: created.slug });
  } catch (e: any) {
    console.error("CREATE LISTING ERROR:", e);
    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
