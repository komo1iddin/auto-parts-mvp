import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  return Response.json({ suppliers });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const { name, phone, wechat, note } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Nom majburiy" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: { name: name.trim(), phone: phone || null, wechat: wechat || null, note: note || null },
  });
  revalidateAppData("suppliers", "parts");
  return Response.json({ supplier }, { status: 201 });
}
