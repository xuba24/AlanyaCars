import { prisma } from "@/lib/prisma";
import { ListingGallery } from "@/components/listing-gallery";
import { MarketBadge } from "@/components/market/market-badge";
import { PrimaryButton } from "@/components/market/primary-button";
import { ShareButton } from "@/components/share-button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Gauge, MapPin, Phone } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const GEARBOX_LABELS = {
  MANUAL: "Механика",
  AUTOMATIC: "Автомат",
  CVT: "Вариатор",
  AMT: "Робот",
  OTHER: "Другое",
} as const;

const DRIVE_LABELS = {
  FWD: "Передний",
  RWD: "Задний",
  AWD: "Полный",
  OTHER: "Другое",
} as const;

const REGISTRATION_LABELS = {
  NOT_CLEARED: "Не растаможен",
  RF: "RUS",
  RSO: "RSO",
} as const;

const CURRENCY_LABELS = {
  RUB: "руб.",
  USD: "USD",
  EUR: "EUR",
  GEL: "GEL",
} as const;

function mapLabel(map: Record<string, string>, value?: string | null) {
  if (!value) return "";
  return map[value] ?? value;
}

function registrationLabel(value?: string | null) {
  if (!value) return "Не указано";
  return REGISTRATION_LABELS[value as keyof typeof REGISTRATION_LABELS] ?? value;
}

function currencyLabel(value?: string | null) {
  if (!value) return CURRENCY_LABELS.RUB;
  return CURRENCY_LABELS[value as keyof typeof CURRENCY_LABELS] ?? value;
}

export default async function ListingPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const listing = await prisma.listing.findFirst({
    where: { slug },
    select: {
      slug: true,
      title: true,
      year: true,
      price: true,
      currency: true,
      mileage: true,
      city: true,
      description: true,
      phone: true,
      isTop: true,
      isUrgent: true,
      isSticker: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      registration: true,
      gearbox: true,
      drive: true,
      engineVolume: true,
      vin: true,
      make: { select: { name: true } },
      model: { select: { name: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, isCover: true },
      },
    },
  });

  if (!listing) return notFound();

  const title =
    listing.title?.trim() ||
    `${listing.make?.name ?? ""} ${listing.model?.name ?? ""} ${listing.year ?? ""}`.trim();

  const priceLabel = `${listing.price.toLocaleString("ru-RU")} ${currencyLabel(
    listing.currency
  )}`;
  const mileageLabel = `${listing.mileage.toLocaleString("ru-RU")} км`;
  const updatedLabel = new Date(listing.updatedAt).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const specs = [
    { label: "Год", value: `${listing.year} г.` },
    { label: "Пробег", value: mileageLabel },
    { label: "Город", value: listing.city ?? "-" },
    { label: "Учет", value: registrationLabel(listing.registration) },
    {
      label: "Объем",
      value: listing.engineVolume ? `${listing.engineVolume} л` : "",
    },
  ];

  const optionalSpecs = [
    { label: "КПП", value: mapLabel(GEARBOX_LABELS, listing.gearbox) },
    { label: "Привод", value: mapLabel(DRIVE_LABELS, listing.drive) },
    { label: "VIN", value: listing.vin ?? "" },
  ].filter((item) => item.value);

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          className="text-sm text-muted-foreground transition hover:text-foreground"
          href="/search?dealType=SALE"
        >
          Назад к поиску
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white/80 p-3 shadow-sm">
            <ListingGallery
              images={listing.images.map((img) => ({
                url: img.url,
                isCover: img.isCover,
              }))}
              title={title}
            />
          </div>

          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {listing.isTop && <MarketBadge variant="top" />}
              {listing.isUrgent && <MarketBadge variant="urgent" />}
              {listing.isSticker && <MarketBadge variant="vip" />}
            </div>

            <h1 className="mt-3 text-3xl font-semibold">{title}</h1>

            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.city ?? "-"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                {mileageLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Обновлено {updatedLabel}
              </span>
            </div>

            <div className="mt-4 text-3xl font-semibold">{priceLabel}</div>
          </div>

          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-semibold">Описание</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {listing.description?.trim() ? listing.description : "Описание не указано."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
            <div className="text-sm font-semibold">Характеристики</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[...specs, ...optionalSpecs].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border bg-white/70 p-3"
                >
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

            <div className="rounded-2xl border bg-white/80 p-5 shadow-sm">
              <div className="text-sm font-semibold">Контакты</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{listing.phone ?? "-"}</span>
              </div>

              {listing.phone && (
                <PrimaryButton className="mt-4 w-full" asChild>
                  <a href={`tel:${listing.phone}`}>Позвонить</a>
                </PrimaryButton>
              )}

              {listing.status === "ACTIVE" && (
                <ShareButton
                  title={title}
                  path={`/listing/${listing.slug}`}
                  className="mt-3 w-full"
                />
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

