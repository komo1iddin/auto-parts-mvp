import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: { children: { orderBy: { name: "asc" } } },
  });
  const roots = categories.filter((c) => !c.parentId);
  return Response.json({ categories: roots });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const { name, parentId } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Nom majburiy" }, { status: 400 });

  const category = await prisma.category.create({
    data: { name: name.trim(), parentId: parentId || null },
  });
  revalidateAppData("categories", "parts");
  return Response.json({ category }, { status: 201 });
}
