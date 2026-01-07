import { PrismaClient } from "@prisma/client";
import { getMakes, getModels } from "car-info";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

function decodeName(value: string) {
  return value.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function main() {
  // Полная замена марок/моделей. Удаляем объявления и связанные записи.
  await prisma.listingPromotion.deleteMany();
  await prisma.moderationLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.model.deleteMany();
  await prisma.make.deleteMany();

  const rawMakes = getMakes();
  const makePairs = rawMakes.map((raw) => ({ raw, name: decodeName(raw) }));

  await prisma.make.createMany({
    data: makePairs.map((m) => ({ name: m.name, slug: slugify(m.name) })),
    skipDuplicates: true,
  });

  const makeRows = await prisma.make.findMany({
    select: { id: true, slug: true },
  });
  const makeBySlug = new Map(makeRows.map((m) => [m.slug, m.id]));

  const modelRows: Array<{ makeId: string; name: string; slug: string }> = [];
  for (const entry of makePairs) {
    const makeId = makeBySlug.get(slugify(entry.name));
    if (!makeId) continue;

    const models = getModels(entry.raw).map(decodeName);
    const seen = new Set<string>();

    for (const modelName of models) {
      const modelSlug = slugify(modelName);
      if (!modelSlug || seen.has(modelSlug)) continue;
      seen.add(modelSlug);
      modelRows.push({ makeId, name: modelName, slug: modelSlug });
    }
  }

  if (modelRows.length > 0) {
    await prisma.model.createMany({
      data: modelRows,
      skipDuplicates: true,
    });
  }

  const ladaName = "Lada Автоваз";
  const ladaSlug = slugify(ladaName);
  const lada = await prisma.make.upsert({
    where: { slug: ladaSlug },
    update: { name: ladaName },
    create: { name: ladaName, slug: ladaSlug },
  });
  const ladaModels = [
    "Granta",
    "Vesta",
    "Niva",
    "Largus",
    "XRAY",
    "Kalina",
    "Priora",
  ];
  await prisma.model.createMany({
    data: ladaModels.map((name) => ({
      makeId: lada.id,
      name,
      slug: slugify(name),
    })),
    skipDuplicates: true,
  });

  // Тестовый пользователь (owner)
  const user = await prisma.user.upsert({
    where: { phone: "+70000000000" },
    update: {},
    create: { phone: "+70000000000", name: "Test User", role: "USER" },
  });

  // Пример объявления
  const toyota = await prisma.make.findUnique({ where: { slug: "toyota" } });
  const camry = await prisma.model.findFirst({
    where: { slug: "camry", makeId: toyota?.id },
  });

  if (toyota && camry) {
    const created = await prisma.listing.create({
      data: {
        slug: `toyota-camry-2018-${Date.now()}`,
        ownerUserId: user.id,
        dealType: "SALE",
        status: "ACTIVE",
        makeId: toyota.id,
        modelId: camry.id,
        title: "Toyota Camry",
        year: 2018,
        price: 17500,
        currency: "RUB",
        mileage: 95000,
        city: "Tbilisi",
        fuel: "GASOLINE",
        gearbox: "AUTOMATIC",
        drive: "FWD",
        body: "SEDAN",
        color: "White",
        phone: "+995500000000",
        description: "Тестовый список для MVP.",
        isTop: true,
      },
    });

    await prisma.listingImage.createMany({
      data: [
        {
          listingId: created.id,
          url: "/demo/camry-1.jpg",
          isCover: true,
          sortOrder: 1,
        },
        {
          listingId: created.id,
          url: "/demo/camry-2.jpg",
          isCover: false,
          sortOrder: 2,
        },
      ],
    });
  }

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
