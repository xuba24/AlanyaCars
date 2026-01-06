import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const makes = await prisma.make.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ makes });
}
