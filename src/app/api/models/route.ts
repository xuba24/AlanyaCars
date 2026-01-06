import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const makeId = searchParams.get("makeId");

  if (!makeId) {
    return NextResponse.json({ models: [] });
  }

  const models = await prisma.model.findMany({
    where: { makeId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      makeId: true,
    },
  });

  return NextResponse.json({ models });
}
