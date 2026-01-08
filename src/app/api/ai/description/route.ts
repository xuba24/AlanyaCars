import { NextResponse } from "next/server";

const AI_GATEWAY_URL = "https://gateway.ai.vercel.com/v1/chat/completions";

type CarContext = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  mileage?: number | null;
  engineVolume?: string | null;
  gearbox?: string | null;
  drive?: string | null;
  city?: string | null;
  registration?: string | null;
};

function formatContext(car: CarContext) {
  const parts = [
    car.make && car.model ? `${car.make} ${car.model}` : car.make || car.model,
    car.year ? `Год: ${car.year}` : null,
    car.price ? `Цена: ${car.price}` : null,
    car.mileage ? `Пробег: ${car.mileage} км` : null,
    car.engineVolume ? `Объем: ${car.engineVolume} л` : null,
    car.gearbox ? `КПП: ${car.gearbox}` : null,
    car.drive ? `Привод: ${car.drive}` : null,
    car.city ? `Город: ${car.city}` : null,
    car.registration ? `Учет: ${car.registration}` : null,
  ];

  return parts.filter(Boolean).join(", ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const description = String(body?.description ?? "").trim();
    const car = (body?.car ?? {}) as CarContext;

    const rawKey = process.env.AI_GATEWAY_API_KEY ?? "";
    const apiKey = rawKey.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY is missing" },
        { status: 500 }
      );
    }
    if (/[^\x20-\x7E]/.test(apiKey)) {
      return NextResponse.json(
        { error: "AI_GATEWAY_API_KEY contains non-ASCII characters" },
        { status: 500 }
      );
    }

    const contextLine = formatContext(car);
    const userPrompt = [
      "Сделай красивое, аккуратное и продающее описание объявления автомобиля.",
      "Пиши по-русски, 2-5 коротких абзацев, до 1200 символов.",
      "Не выдумывай факты, которых нет.",
      contextLine ? `Данные: ${contextLine}.` : "Данных мало.",
      description ? `Черновик пользователя: ${description}` : "Черновика нет.",
    ].join("\n");

    const r = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: "Ты помогаешь улучшать объявления авто." },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: "AI request failed", details: data },
        { status: r.status }
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.output_text?.trim() ||
      "";

    if (!text) {
      return NextResponse.json(
        { error: "AI returned empty text" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "AI error" },
      { status: 500 }
    );
  }
}
