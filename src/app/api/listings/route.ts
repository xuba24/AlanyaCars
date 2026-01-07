import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserIdFromCookies, requireUserId } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}
export async function GET(req: Request) {
  const userId = await getSessionUserIdFromCookies();
  const { searchParams } = new URL(req.url);

  const dealType = searchParams.get("dealType") ?? "SALE";
  const ord = searchParams.get("ord") ?? "date_desc";

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const makeId = searchParams.get("makeId") || null;
  const modelId = searchParams.get("modelId") || null;

  const yearFrom = searchParams.get("yearFrom") ? Number(searchParams.get("yearFrom")) : null;
  const yearTo = searchParams.get("yearTo") ? Number(searchParams.get("yearTo")) : null;

  const priceFrom = searchParams.get("priceFrom") ? Number(searchParams.get("priceFrom")) : null;
  const priceTo = searchParams.get("priceTo") ? Number(searchParams.get("priceTo")) : null;

  const mileageFrom = searchParams.get("mileageFrom") ? Number(searchParams.get("mileageFrom")) : null;
  const mileageTo = searchParams.get("mileageTo") ? Number(searchParams.get("mileageTo")) : null;

  const city = searchParams.get("city")?.trim() || null;
  const registrationRaw = searchParams.get("registration")?.trim() || null;
  const allowedRegistrations = new Set(["NOT_CLEARED", "RF", "RSO"]);
  const registration = registrationRaw && allowedRegistrations.has(registrationRaw)
    ? registrationRaw
    : null;

  const where: any = {
    dealType,
    status: "ACTIVE", // ⚠️ в поиске показываем только опубликованные
  };

  if (makeId) where.makeId = makeId;
  if (modelId) where.modelId = modelId;

  if (yearFrom || yearTo) {
    where.year = {};
    if (yearFrom) where.year.gte = yearFrom;
    if (yearTo) where.year.lte = yearTo;
  }

  if (priceFrom || priceTo) {
    where.price = {};
    if (priceFrom) where.price.gte = priceFrom;
    if (priceTo) where.price.lte = priceTo;
  }

  if (mileageFrom || mileageTo) {
    where.mileage = {};
    if (mileageFrom) where.mileage.gte = mileageFrom;
    if (mileageTo) where.mileage.lte = mileageTo;
  }

  if (city) where.city = city;
  if (registration) where.registration = registration;

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    ord === "price_asc"
      ? { price: "asc" }
      : ord === "price_desc"
      ? { price: "desc" }
      : ord === "mileage_asc"
      ? { mileage: "asc" }
      : ord === "mileage_desc"
      ? { mileage: "desc" }
      : ord === "date_asc"
      ? { createdAt: "asc" }
      : { createdAt: "desc" };

  const [total, rows] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
        favorites: {
          where: { userId: userId ?? "__" },
          select: { id: true },
          take: 1,
        },
        images: {
          where: { isCover: true },
          take: 1,
          select: { url: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: rows.map((x) => {
      const { images, favorites, ...rest } = x;
      return {
        ...rest,
        coverImageUrl: images?.[0]?.url ?? null,
        isFavorite: favorites?.length > 0,
      };
    }),
  });
}

export async function POST(req: Request) {
  try {
    const ownerUserId = await requireUserId();
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
    const phone = body.phone ? String(body.phone) : null;
    const description = body.description ? String(body.description) : null;

    // ---- validation ----
    if (!makeId || !modelId) {
      return NextResponse.json(
        { error: "makeId и modelId обязательны" },
        { status: 400 }
      );
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
    if (engineVolume && !/^\d+(\.\d{1,2})?$/.test(engineVolume)) {
      return NextResponse.json(
        { error: "Некорректный объем двигателя" },
        { status: 400 }
      );
    }
    if (registrationRaw && !registration) {
      return NextResponse.json({ error: "Некорректный учет" }, { status: 400 });
    }

    // ---- load make/model names to build title ----
    const [make, model] = await Promise.all([
      prisma.make.findUnique({ where: { id: makeId }, select: { name: true, slug: true } }),
      prisma.model.findUnique({ where: { id: modelId }, select: { name: true, slug: true } }),
    ]);

    if (!make || !model) {
      return NextResponse.json(
        { error: "Марка или модель не найдены" },
        { status: 400 }
      );
    }

    const title = `${make.name} ${model.name} ${year}`;

    const slug = `${slugify(make.slug ?? make.name)}-${slugify(
      model.slug ?? model.name
    )}-${year}-${Date.now()}`;

    // ---- create listing ----
    // ⚠️ ВАЖНО: если у тебя в Prisma есть дополнительные обязательные поля,
    // Prisma здесь скажет "Argument X is missing" — тогда мы добавим дефолты.
    const created = await prisma.listing.create({
      data: {
        slug,
        title,          // ✅ обязательное поле
        makeId,
        modelId,
        ownerUserId,
        year,
        price,
        currency: "RUB",
        mileage,
        registration,
        city,
        phone,
        description,
        engineVolume,
        status: "DRAFT",
        dealType: "SALE",
      } as any,
      select: { slug: true },
    });

    return NextResponse.json({ slug: created.slug });
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
