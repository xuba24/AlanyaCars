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
    const userId = await requireUserId();
    const body = await req.json();

    const makeId = String(body.makeId ?? "");
    const modelId = String(body.modelId ?? "");

    const year = Number(body.year);
    const price = Number(body.price);
    const mileage = Number(body.mileage);

    const city = body.city ? String(body.city) : null;
    const engineVolumeRaw = body.engineVolume ? String(body.engineVolume) : "";
    const engineVolume = engineVolumeRaw.trim()
      ? engineVolumeRaw.trim().replace(",", ".")
      : null;
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

    if (!makeId || !modelId) {
      return NextResponse.json({ error: "makeId и modelId обязательны" }, { status: 400 });
    }
    if (!Number.isFinite(year) || year < 1950 || year > 2100) {
      return NextResponse.json({ error: "Некорректный год" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Некорректная цена" }, { status: 400 });
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      return NextResponse.json({ error: "Некорректный пробег" }, { status: 400 });
    }
    if (engineVolume && !/^\d+(\.\d{1,2})?$/.test(engineVolume)) {
      return NextResponse.json(
        { error: "Некорректный объем двигателя" },
        { status: 400 }
      );
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

    const make = await prisma.make.findUnique({ where: { id: makeId }, select: { name: true, slug: true } });
    const model = await prisma.model.findUnique({ where: { id: modelId }, select: { name: true, slug: true } });

    if (!make || !model) {
      return NextResponse.json({ error: "Марка/модель не найдены" }, { status: 400 });
    }

    const title = `${make.name} ${model.name}`;
    const slug = `${slugify(make.slug ?? make.name)}-${slugify(model.slug ?? model.name)}-${year}-${Date.now()}`;

    // ⚠️ ДЕФОЛТЫ для обязательных полей (если у тебя они required в schema)
    const created = await prisma.listing.create({
      data: {
        slug,
        ownerUserId: userId,
        status: "DRAFT",
        dealType: "SALE",

        makeId,
        modelId,

        title,
        year,
        price,
        currency: "RUB",
        mileage,
        registration,

        city,
        phone,
        description,
        engineVolume,

        gearbox,
        drive,
      } as any,
      select: { slug: true },
    });

    return NextResponse.json({ ok: true, slug: created.slug });
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
