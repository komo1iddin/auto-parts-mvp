import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function GET() {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return Response.json({ customers });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { name, phone, note } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Mijoz nomi majburiy" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      note: note?.trim() || null,
    },
  });

  revalidateAppData("customers", "orders");
  return Response.json({ customer }, { status: 201 });
}
